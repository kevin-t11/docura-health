# Docura health intelligence layer of solving documents overhead

1. Client
- it has a client browser nextjs application that accepts a file that can be any pdf or docs or csv file and user can upload it and he/she wants to basically gets the summary and information from that doc. 
- 


2. Server
- an express app that does that full processing of the doc handling. whenever the user uploads a file these following steps needs to follow.
    - upload/store into s3 bucket
    - extract the text from the document by using pdf-parser  for native pdf and if not native pdf then use ocr technology , will gonna use AWS Textract for it. 
    - now parse the document
    - divide into chunks with proper metadata information
    - convert into embedding using openai embedding model
    - now store into pinecone index with proper context

now the architecture part comes in : 

when the user gets uploads a file then we need to push into queue and create a job and update the status accordingly when the following steps are being fulfilled.
- started
- extracted
- parsed
- chunked
- embedded
- stored

# how the user flow works
 - user uploads a file, it gets processed. meanwhile we will show proper status changing loader
 - user gets proper detailed overview of the docs, missing issues, requirements, whats objective, callouts, important points, timeline of doc (whats happens throught the time being passed)
 - a chat panel user can ask a query/question about the docs and gets the response from the RAG.
 - a proof panel that has all the documents access user can preview and get verified.

Tech stack is used : pinecone, redis bullmq, aws s3 bucket, aws textract, nextjs, express with bun, pdf-parser lib.

- Docker compose file is up for the both server to run the application and process it.
