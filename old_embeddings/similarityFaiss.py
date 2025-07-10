from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import psycopg2
import os

# Load Sentence-BERT model
model = SentenceTransformer('all-MiniLM-L6-v2')

# File paths
faiss_index_path = "faiss_index.bin"
negotiation_ids_path = "negotiation_ids.npy"

# Check if the FAISS index file exists
if not os.path.exists(faiss_index_path):
    raise FileNotFoundError(f"FAISS index file not found: {faiss_index_path}")

# Check if the negotiation IDs file exists
if not os.path.exists(negotiation_ids_path):
    raise FileNotFoundError(f"Negotiation IDs file not found: {negotiation_ids_path}")

# Load FAISS index and IDs
index = faiss.read_index(faiss_index_path)
negotiation_ids = np.load(negotiation_ids_path)

# Connect to PostgreSQL
conn = psycopg2.connect(
    dbname="thesisdb",
    user="admin",
    password="admin",
    host="localhost",
    port="5432"
)
cur = conn.cursor()


# Query input
query = "On 4 February 2011, clashes broke out once again in the vicinity of Preah Vihear. Both sides made use of heavy weapons such as artillery, mortars, and multi-rocket launchers. On the same day, military leaders from both countries held phone calls and exchanged text messages to try arranging a ceasefire, but to no result."
query_embedding = model.encode([query]).astype('float32')

# Perform similarity search
k = 3  # Number of top results
distances, indices = index.search(query_embedding, k)

# Retrieve metadata for the top results
results = []
for i in range(k):
    negotiation_id = negotiation_ids[indices[0][i]]
    cur.execute("SELECT * FROM negotiations WHERE negotiation_id = %s;", (negotiation_id,))
    result = cur.fetchone()
    results.append(result)

# Close connection
cur.close()
conn.close()

# Display results
print("Top similar negotiations:")
for result in results:
    print(result)