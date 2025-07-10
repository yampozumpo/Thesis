## This script performs clustering on a dataset of peace negotiations using Gaussian Mixture Models (GMM).

import pandas as pd
from sklearn.decomposition import PCA
from sklearn.mixture import GaussianMixture
from sklearn.metrics import silhouette_score
import matplotlib.pyplot as plt
from collections import Counter
import numpy as np

# Load your dataset (replace with your actual file path)
df = pd.read_csv('./data/peace_observatory(negotiations).csv', delimiter=';')  # Adjust file path as needed

# Step 1: Identify Boolean Columns
boolean_columns = [col for col in df.columns if df[col].dropna().isin([0, 1]).all()]

# Convert 0 to False and 1 to True
df[boolean_columns] = df[boolean_columns].replace({0: False, 1: True}).infer_objects(copy=False)

# Handle Missing Values
df[boolean_columns] = df[boolean_columns].fillna(False).infer_objects(copy=False)

# Step 2: Feature Extraction - Create a Boolean Feature Matrix
negotiation_features = df[boolean_columns]

# Apply PCA for Dimensionality Reduction
pca = PCA(n_components=2, random_state=1)  # Reduce to 2 components for visualization
negotiation_features_pca_2d = pca.fit_transform(negotiation_features)

print(f"PCA reduced to {negotiation_features_pca_2d.shape[1]} dimensions for visualization.")

# Parameters for GMM and clustering
n_components = 5  # Number of clusters
min_points = 50   # Minimum points per cluster
num_runs = 30     # Number of GMM runs with different random states

# Variables to store the best result
best_silhouette_score = -1
best_cluster_labels = None
best_gmm = None

# Run GMM multiple times and keep the configuration with the highest silhouette score
for i in range(num_runs):
    random_state = i  # Set different random states for each run
    gmm = GaussianMixture(n_components=n_components, random_state=random_state)
    cluster_labels = gmm.fit_predict(negotiation_features_pca_2d)
    
    # Enforce Minimum Cluster Size
    cluster_counts = Counter(cluster_labels)
    small_clusters = [label for label, count in cluster_counts.items() if count < min_points]
    
    for label in small_clusters:
        small_cluster_indices = np.where(cluster_labels == label)[0]
        for idx in small_cluster_indices:
            probabilities = gmm.predict_proba([negotiation_features_pca_2d[idx]])[0]
            valid_distances = [(j, p) for j, p in enumerate(probabilities) if j != label and cluster_counts[j] >= min_points]
            
            if valid_distances:
                new_label = max(valid_distances, key=lambda x: x[1])[0]
                cluster_labels[idx] = new_label
                cluster_counts[new_label] += 1
                cluster_counts[label] -= 1

    # Calculate silhouette score for this configuration
    silhouette_avg = silhouette_score(negotiation_features_pca_2d, cluster_labels)
    print(f"Run {i+1} - Silhouette Score: {silhouette_avg}")

    # Update best configuration if this run has the highest silhouette score
    if silhouette_avg > best_silhouette_score:
        best_silhouette_score = silhouette_avg
        best_cluster_labels = cluster_labels
        best_gmm = gmm

print(f"\nBest Silhouette Score: {best_silhouette_score}")

# Add the best cluster labels to the DataFrame
df['negotiation_cluster'] = best_cluster_labels

# Plot the PCA-Reduced Data in 2D with Clusters
plt.figure(figsize=(10, 8))
plt.scatter(negotiation_features_pca_2d[:, 0], negotiation_features_pca_2d[:, 1], c=best_cluster_labels, cmap='viridis', alpha=0.7)
plt.colorbar(label='Cluster')
plt.xlabel("PCA Component 1")
plt.ylabel("PCA Component 2")
plt.title(f"PCA 2D Visualization of Data with GMM Clusters (n_components={n_components})")
plt.show()

# Optional: Display the Mean of Each Boolean Feature per Cluster for Interpretation
cluster_summary = df.groupby('negotiation_cluster')[boolean_columns].mean()
print("\nCluster Feature Summary (After Enforcing Minimum Cluster Size):")
print(cluster_summary)

# Identify Lead Attributes for Each Cluster
lead_attributes = {}
for cluster in cluster_summary.index:
    lead_attributes[cluster] = cluster_summary.loc[cluster][cluster_summary.loc[cluster] > 0.5].index.tolist()

print("\nLead Attributes for Each Cluster:")
for cluster, attributes in lead_attributes.items():
    print(f"Cluster {cluster}: {attributes}")

# Save the lead attributes to a CSV file
lead_attributes_df = pd.DataFrame.from_dict(lead_attributes, orient='index').transpose()
lead_attributes_df.to_csv('./data/lead_attributes_per_cluster.csv', index=False)