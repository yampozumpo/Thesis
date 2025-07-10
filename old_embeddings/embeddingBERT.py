import psycopg2
from sentence_transformers import SentenceTransformer
import numpy as np

# Connect to the PostgreSQL database
conn = psycopg2.connect(
    dbname="thesisdb",
    user="admin",
    password="admin",
    host="localhost",
    port="5432"
)
cur = conn.cursor()

# Load descriptions from the database
cur.execute("SELECT negotiation_id, description FROM negotiations;")
rows = cur.fetchall()

# Extract descriptions and IDs
negotiation_ids = [row[0] for row in rows]
descriptions = [row[1] for row in rows]

# Generate embeddings using Sentence-BERT
model = SentenceTransformer('all-MiniLM-L6-v2')
embeddings = model.encode(descriptions)

# Save embeddings and IDs
np.save("negotiation_embeddings.npy", embeddings)
np.save("negotiation_ids.npy", negotiation_ids)

cur.close()
conn.close()
print("Embeddings generated and saved.")
