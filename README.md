# Papertrail — a browser-based RAG application

**Author: Marymar Danytza Calloticona Chambilla**

Papertrail implements retrieval-augmented generation in JavaScript: Markdown ingestion, overlapping chunks, BM25 retrieval, a context-augmented prompt, and actual FLAN-T5 text generation through Transformers.js in a Web Worker. Retrieved passages, scores and model metadata remain visible for inspection. The application requires no paid API key.

## Public links

- [English article](https://dev.to/marymar_danytzacallotico/building-a-browser-based-rag-application-with-javascript-and-hugging-face-3mii)
- [Live application](https://danycalloticona010-dotcom.github.io/papertrail-rag/)
- [Public repository](https://github.com/danycalloticona010-dotcom/papertrail-rag)
- [Successful automated deployment](https://github.com/danycalloticona010-dotcom/papertrail-rag/actions/runs/45825632455)

Verified on 2026-11-26.

## Architecture

```text
8 fictional handbook Markdown documents
  → build corpus.json → 80-word chunks with 12-word overlap
  → BM25 index → question → highest-ranked qualifying passage
  → context-augmented prompt → FLAN-T5-small ONNX, in a browser worker
  → generated answer + retrieved evidence + exportable session JSON
```

The example handbook is entirely fictional. It describes an invented Atlas Learning Lab, not an actual university. The site is static hosting; model inference happens on the visitor's device. Hugging Face hosts the public model files; it is not the application's inference backend.

## Run locally

Node.js 22 and Python 3 for a static server are sufficient. There are no npm dependencies to install for the build or retrieval tests; the browser fetches the inference library and model at runtime.

```sh
npm test
npm run build
python -m http.server 8084 --directory dist
```

Open http://localhost:8084. Do not open the HTML using `file://`. Use an English question, then select **Generate answer**. The first run downloads the quantized model files from Hugging Face. Later runs may reuse the browser cache. **Inspect evidence** runs retrieval without loading the language model.

## Model and runtime

- Transformers.js: `3.8.1`, loaded from jsDelivr.
- Model: `Xenova/flan-t5-small`, quantized `q8`, ONNX.
- Model revision: `311454e83bc784267fd7eef5940ee854144abbec`.
- Execution: single-threaded WebAssembly in a Web Worker.
- Generation: deterministic decoding, at most 80 new tokens.
- Input: application budget of 480 tokenizer tokens; longer prompts fail explicitly.

No secret belongs in browser source. Questions and retrieved context are processed locally; the browser makes external requests to download the library, model and fonts. This is not an offline-first application. Device memory, browser compatibility, blocked CDNs and network speed affect startup. The external model is Apache-2.0 licensed; see its model card.

## Retrieval and generation policies

The retriever lowercases and tokenizes English text and removes a fixed stopword list. BM25 ranks chunks. A chunk must match at least half the query's unique non-stopword terms; this rule is lexical and does not guarantee semantic relevance. The user-facing application supplies the highest-ranked qualifying passage to the generator to keep the context focused.

When no passage qualifies, the application returns an explicit inability to answer and does not invoke the model. Otherwise, the prompt is `Context: <passage>\n\nBased on the context, <question>`. Source cards identify retrieved evidence; they do not certify every generated statement. Model output is rendered as text, not HTML. An inference error is shown as an error rather than disguised as a generated answer.

## Validation

Seven automated test groups cover six document-retrieval examples, unrelated-query abstention, empty input, chunk boundaries/overlap, invalid configurations, prompt construction and deterministic finite ranking scores. The six handcrafted retrieval examples have top-1 accuracy 6/6 locally. That small dataset is not a broad retrieval benchmark.

Local browser integration checks ran the real model:

- Support reference question: generated `ORBIT-42`, matching the retrieved document.
- Library-hours question: generated the documented weekday 09:00–17:00 hours and weekend closure.
- An unrelated capital-city question: no qualifying evidence; generation skipped.
- **Known failure:** a loan-duration question retrieved the correct equipment document, but generation answered the maximum number of adapters rather than the three-day duration. Correct retrieval does not guarantee a correct answer.

Evidence is in `evidence/`. Initial prompt comparisons are retained to explain the final prompt choice. Generation is tested separately from retrieval. Browser times are examples from a particular device, not performance guarantees.

## Automated public deployment

The application is deployed on GitHub Pages, a public SaaS host. `.github/workflows/deploy.yml` tests retrieval, builds `dist/`, checks JavaScript syntax, and deploys only after the build job succeeds. It uses GitHub's short-lived workflow token and requires no cloud secret. The initial source was imported from `bootstrap-source.zip`; the workflow imports a changed archive after path validation and records the imported files in the repository. Ordinary source changes can also be committed directly and deployed through the same workflow.

The links above identify the published article, working public application and successful workflow. `evidence/public-generation-validation.json` records real model checks on the public deployment. `delivery/links.json` records the remaining video and student submission steps.

## Scope and limits

The application uses sparse lexical retrieval, not embeddings or a vector database. It has no file uploads, conversational memory, continuous ingestion, remote tools, authentication or shared storage. It cannot guarantee faithful answers or defend arbitrary untrusted corpora against prompt injection. The curated public corpus is suitable for an educational demo, not sensitive or consequential decisions.

For larger corpora, consider semantic or hybrid retrieval, reranking, stronger models and a larger evaluation set. Recheck both retrieval quality and answer correctness when changing any stage.

## Delivery materials

- `docs/article-devto.md`: Source of the published English article.
- `docs/video-script.md`: suggested recording plan of 4:30.
- `delivery/`: publication status and public links when verified.
- The video recording and Telegram submission will be completed by Marymar, as she requested.

## References

- [FLAN-T5-small ONNX model card](https://huggingface.co/Xenova/flan-t5-small)
- [Transformers.js pipeline API](https://huggingface.co/docs/transformers.js/pipelines)
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

MIT license for application code. The invented handbook is released under CC0.
