import faiss
import numpy as np

# Load embeddings and IDs
embeddings = np.load("negotiation_embeddings.npy")
negotiation_ids = np.load("negotiation_ids.npy")

# Initialize FAISS index
embedding_dim = embeddings.shape[1]
index = faiss.IndexFlatL2(embedding_dim)

# Add embeddings to the index
index.add(embeddings.astype('float32'))

# Save the FAISS index
faiss.write_index(index, "faiss_index.bin")
print("FAISS index created and saved.")
