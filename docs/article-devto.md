---
title: "Building a Browser-Based RAG Application with JavaScript and Hugging Face"
published: false
tags: ai, javascript, rag, tutorial
---

**Author: Marymar Danytza Calloticona Chambilla**

I built **Papertrail**, a retrieval-augmented generation application that answers questions about a small document collection. It retrieves relevant text, adds that evidence to a prompt, and runs a real language model in the browser. The interface shows the generated answer alongside the original passage so readers can inspect what the model was given.

The implementation uses JavaScript, BM25 retrieval, Transformers.js, and a quantized FLAN-T5-small ONNX model from Hugging Face. It does not require a paid inference API or an API key in the frontend. The deployment workflow targets GitHub Pages; Hugging Face supplies the model files rather than hosting the application's inference service.

## 1. Why add retrieval to generation?

A language model's training data does not contain an application's newly written handbook. For this project, I created eight fictional Atlas Learning Lab documents covering library hours, reservations, support, project delivery, data privacy, reproducible builds, equipment checkout, and questions outside the handbook.

One document states that the support reference code is **ORBIT-42**. That invented detail makes a useful demonstration: the application should retrieve the document before producing its answer. The handbook is explicitly fictional and does not describe policies at a real institution.

## 2. The RAG architecture

```text
Markdown documents
    ↓ build
Public corpus.json
    ↓ chunk + index
BM25 retriever ← user question
    ↓ highest-ranked qualifying passage
Context-augmented prompt
    ↓ Web Worker + FLAN-T5-small
Generated answer + inspectable evidence
```

This implementation uses **sparse lexical retrieval**. RAG does not require a vector database: the essential connection is retrieving external context and supplying it to the generator. An embedding-based or hybrid retriever would be a reasonable extension for more varied wording and larger collections.

## 3. Ingesting and chunking documents

Each Markdown file has a title and body. A Node.js build script creates `corpus.json` and copies the documents into the deployment output. Each record keeps its document ID, title, text, and public source path.

The chunker uses windows of at most 80 words with an overlap of 12 words. The current short documents each fit in one chunk, so the sample produces eight indexed chunks; a separate test uses a longer document to verify splitting and overlap.

Preserving source identifiers matters. A retrieved passage should remain traceable to its original document, rather than becoming an anonymous piece of prompt text.

## 4. Ranking passages with BM25

The retriever normalizes English text, tokenizes it, and removes a fixed stopword list. It tracks term frequency, document frequency, and average chunk length to compute BM25 scores.

For a passage to qualify, it must match at least half of the query's unique non-stopword terms. The UI uses the highest-ranked qualifying passage. This threshold is a simple lexical rule, not a probability or a guarantee of semantic relevance.

If no passage qualifies, the application says it cannot answer from its documents and skips model generation. For example, the capital-city question used in testing has no qualifying passage. That refusal comes from application logic, not from asking the model to invent a confidence score.

## 5. Building the augmented prompt

The selected passage and user question are combined using this template:

```text
Context: <retrieved passage>

Based on the context, <user question>
```

I tested several prompt formats on the actual model rather than assuming that an instruction would work. An early version with an explicit fallback instruction refused a supported question. Another version mixed a relevant library passage with an unrelated sentence from a second retrieved document. The final application uses a focused single-passage context and the template above.

Before generation, the tokenizer checks the input length. The application rejects prompts above 480 tokens instead of silently relying on truncation. Questions are limited to 300 characters, and generation is limited to 80 new tokens.

## 6. Running the language model in a worker

The [Hugging Face model card](https://huggingface.co/Xenova/flan-t5-small) provides an ONNX version of FLAN-T5-small compatible with Transformers.js. I use a pinned model revision and Transformers.js 3.8.1.

```javascript
const generator = await pipeline(
  'text2text-generation',
  'Xenova/flan-t5-small',
  {
    device: 'wasm',
    dtype: 'q8',
    revision: '311454e83bc784267fd7eef5940ee854144abbec'
  }
);
const output = await generator(prompt, {
  max_new_tokens: 80,
  do_sample: false,
  num_beams: 1
});
```

The complete implementation runs this code in a module Web Worker and sets WebAssembly to one thread. The worker reports model-download progress, input-token counts, generation time, and failures to the interface. The [Transformers.js pipeline documentation](https://huggingface.co/docs/transformers.js/pipelines) describes the text-to-text generation API.

The first run downloads model files from Hugging Face. Later runs may reuse browser storage. Questions and retrieved context are processed on the visitor's device; the browser still contacts external services to download model files, the inference library, and optional fonts. Startup depends on the device, network, and CDN availability.

## 7. Displaying evidence without overstating it

The answer panel displays the model's generated text. Source cards display the original passage, document link, BM25 score, and lexical query coverage. These are retrieved sources, not automatically verified citations for every generated statement.

Model output is inserted as text rather than HTML. If inference fails, the application reports an error and preserves the retrieved passage. It does not substitute an extract and pretend that generation succeeded. An **Inspect evidence** button lets a visitor test retrieval without downloading the model, and a JSON export records the most recent session.

## 8. Testing retrieval separately from answer quality

Seven automated test groups check the retriever, unrelated-query abstention, empty input, chunk boundaries and overlap, invalid chunk settings, prompt construction, and deterministic finite scores. The six handcrafted retrieval questions selected the expected document in all six cases locally. That result applies only to this small test set, not to arbitrary questions.

Local browser integration checks exercised the actual language model:

- The support-code question generated **ORBIT-42**, matching the retrieved document.
- The library question generated the documented weekday **09:00–17:00** schedule and weekend closure.
- An unrelated capital-city question triggered the application's no-evidence refusal and skipped generation.
- A loan-duration question retrieved the correct equipment document, but the model answered the maximum number of adapters rather than the borrowing duration.

That last failure is important: **correct retrieval does not guarantee a correct generated answer**. The source card lets a reader identify the mismatch. A stronger model, broader evaluation set, and answer-verification strategy would be needed before relying on this design for consequential decisions.

## 9. Automating the public deployment

The GitHub Actions workflow runs on pushes to `main` and supports manual execution. It runs retrieval tests, builds the static output, checks JavaScript syntax, and publishes the site through GitHub Pages. The deployment job depends on a successful build, so a failing test blocks publication of the new version.

GitHub Pages serves the application files; inference remains in the browser. The workflow uses GitHub's short-lived deployment token and needs no external cloud credential. The [Pages custom-workflow guide](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) describes that publishing flow.

The repository and deployment links will be added after their public availability and a successful workflow execution are verified. A workflow configuration alone is not evidence of a successful deployment.

## 10. What I would improve next

Papertrail is a small educational RAG application, not a production knowledge system. It has no conversation memory, document uploads, vector database, continuous ingestion, or remote tools. Its English lexical retrieval can miss paraphrases, and its small generator can answer the wrong aspect of a question.

For a larger collection, I would evaluate semantic or hybrid retrieval, reranking, a stronger generator, and separate metrics for retrieval recall and answer faithfulness. I would keep the original evidence accessible and rerun evaluations after changing either the corpus or the model.

**Author: Marymar Danytza Calloticona Chambilla.**

This article and application were prepared with AI assistance and execution checks.
