#Check Mutual Exclusivity and Inclusivity of Boolean Columns in a Dataset

import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import ListedColormap

# Load your dataset
df = pd.read_csv('./data/peace_observatory(negotiations).csv', delimiter=';')  # Replace with the correct file path

# Step 1: Identify boolean columns
boolean_columns = [col for col in df.columns if df[col].dropna().isin([0, 1]).all()]

# Convert 0 to False and 1 to True
df[boolean_columns] = df[boolean_columns].replace({0: False, 1: True})

# Print the number of rows in the dataframe
print("Number of rows in the dataframe:", len(df))

# Step 2: Check for 95% Mutual Exclusivity
def check_95_percent_mutual_exclusivity(df, col1, col2):
    # Check if both columns have True (1) in the same row less than 5% of the time
    overlap_count = ((df[col1] & df[col2]) == True).sum()
    total_count = len(df)
    return overlap_count / total_count <= 0.005

# Step 3: Check for 95% Mutual Inclusivity
def check_95_percent_mutual_inclusivity(df, col1, col2):
    # Check if both columns have True (1) in the same row at least 95% of the time
    overlap_count = ((df[col1] & df[col2]) == True).sum()
    total_count = len(df)
    return overlap_count / total_count >= 0.999

# Initialize the mutual exclusivity and inclusivity matrix
mutual_exclusivity_matrix = np.zeros((len(boolean_columns), len(boolean_columns)))
mutually_exclusive_dict = {col: [] for col in boolean_columns}

# Find all 95% mutually exclusive and inclusive pairs
for i, col1 in enumerate(boolean_columns):
    for j, col2 in enumerate(boolean_columns[i+1:], start=i+1):
        if check_95_percent_mutual_exclusivity(df, col1, col2):
            mutual_exclusivity_matrix[i, j] = -1  # Mark as mutually exclusive
            mutual_exclusivity_matrix[j, i] = -1  # Symmetric entry
            mutually_exclusive_dict[col1].append(col2)
            mutually_exclusive_dict[col2].append(col1)
        elif check_95_percent_mutual_inclusivity(df, col1, col2):
            mutual_exclusivity_matrix[i, j] = 1  # Mark as mutually inclusive
            mutual_exclusivity_matrix[j, i] = 1  # Symmetric entry

# Save the mutually exclusive columns for each column to a CSV file
mutually_exclusive_df = pd.DataFrame(dict([(k, pd.Series(v)) for k, v in mutually_exclusive_dict.items()]))
mutually_exclusive_df.to_csv('./data/mutually_exclusive_columns.csv', index=False)

# Step 4: Visualize the Mutual Exclusivity and Inclusivity Matrix
colors = ['red', 'white', 'blue']
cmap = ListedColormap(colors)

# Create the plot
plt.figure(figsize=(12, 10))
plt.imshow(mutual_exclusivity_matrix, cmap=cmap, vmin=-1, vmax=1)  # vmin and vmax set the range of values

# Add a colorbar with custom ticks
cbar = plt.colorbar(ticks=[-1, 0, 1])
cbar.ax.set_yticklabels(['-1 (Red)', '0 (White)', '1 (Blue)'])

# Add gridlines and labels
plt.grid(which='major', color='gray', linestyle='--', linewidth=0.5)
plt.xticks(range(mutual_exclusivity_matrix.shape[1]))
plt.yticks(range(mutual_exclusivity_matrix.shape[0]))
plt.title('Matrix Visualization')

plt.show()

# Step 5: Calculate Correlations
# Compute the correlation matrix for boolean columns
'''
correlation_matrix = df[boolean_columns].corr()

print("\nCorrelation Matrix for Boolean Columns:")
print(correlation_matrix)

# Step 6: Visualize the Correlation Matrix
plt.figure(figsize=(10, 8))
sns.heatmap(correlation_matrix, cmap="coolwarm", vmin=-1, vmax=1)
plt.title("Correlation Matrix of Boolean Columns")
plt.show()
'''
# Step 5: Count the number of times each column is 1 when 'mediated_negotiations' is 1
# Count the number of times each column is 1 when 'mediated_negotiations' is 1
mediated_negotiations_true = df[df['mediated_negotiations'] == True]
count_when_mediated_negotiations_true = mediated_negotiations_true[boolean_columns].sum()

print("Number of times each column is 1 when 'mediated_negotiations' is 1:")
print(count_when_mediated_negotiations_true)

for col in boolean_columns:
    count_when_mediated_negotiations_true = mediated_negotiations_true[col].sum()
    if count_when_mediated_negotiations_true < 20:
        print(f"Number of times {col} is 1 when 'mediated_negotiations' is 1: {count_when_mediated_negotiations_true}")

# Count the number of times each column is 1 when 'bilateral_negotiations' is 1
bilateral_negotiations_true = df[df['bilateral_negotiations'] == True]
count_when_bilateral_negotiations_true = bilateral_negotiations_true[boolean_columns].sum()

print("\nNumber of times each column is 1 when 'bilateral_negotiations' is 1:")
print(count_when_bilateral_negotiations_true)

for col in boolean_columns:
    count_when_bilateral_negotiations_true = bilateral_negotiations_true[col].sum()
    if count_when_bilateral_negotiations_true < 20:
        print(f"Number of times {col} is 1 when 'bilateral_negotiations' is 1: {count_when_bilateral_negotiations_true}")