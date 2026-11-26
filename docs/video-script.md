# Recording guide — planned duration 4 minutes 30 seconds

Presenter: Marymar Danytza Calloticona Chambilla.
Marymar will record and publish the video, then send the article and video links to Telegram.

| Time | What to show |
| --- | --- |
| 0:00–0:25 | Introduce yourself and Papertrail: JavaScript RAG with BM25 retrieval and Hugging Face FLAN-T5 running in the browser. |
| 0:25–1:00 | Open the public repository. Explain the eight fictional handbook documents, chunking and source IDs. |
| 1:00–1:45 | Show retrieval.js and generator.worker.js. Trace question → retrieved passage → augmented prompt → model generation. Explain that sparse retrieval is used, with no vector database. |
| 1:45–2:35 | In the public app, ask “What is the support desk reference code?” Show the actual generated ORBIT-42 answer and the original source passage. Then demonstrate library opening hours. |
| 2:35–3:05 | Ask “What is the capital of France?” Show that no evidence qualifies and generation is skipped. Explain the difference between retrieval and answer correctness; mention the documented loan-duration failure. |
| 3:05–3:55 | Open a genuinely successful GitHub Actions run. Show tests, build and deploy, then the public URL. Explain that GitHub Pages serves assets and the browser downloads the model from Hugging Face. |
| 3:55–4:30 | Show the English DEV.to article, your full name and public links. Mention model download, browser requirements, fictional data and generation limitations. |

Keep the final video at or below five minutes. Verify public visibility and add its URL to the delivery ZIP. Never show credentials or private notifications. Do not describe a local test as a verified public deployment.
