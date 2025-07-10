# This script groups mediators, purposes, and success metrics in a dataset based on predefined categories.

import pandas as pd

# Load the dataset
df = pd.read_csv("./data/peace_observatory(negotiations).csv", delimiter=";")

# Define mediator groups
mediator_groups = {
    "Government-Related": ["foreign_government", "government", "president", "local_government", "government_forces", "police"],
    "NGOs and Organizations": ["local_ngo", "international_ngo", "regional_organization", "international_organization", "peace_operation", "language_organization"],
    "Community Leaders": ["community_leaders", "traditional_leaders", "religious_leaders", "religious_any", "local_committee"],
    "Political Entities": ["political_party", "armed_group", "national_committee", "individual"]
}

# Categorize mediators
def categorize_mediator(row):
    for group, columns in mediator_groups.items():
        if any(row[col] == 1 for col in columns if col in row):
            return group
    return "Other"

df["mediator_group"] = df.apply(categorize_mediator, axis=1)

# Define purpose groups
purpose_groups = {
    "Pre-Negotiation": ["prenego", "nego_continue"],
    "Conflict Resolution": ["nego_ceasefire", "nego_agreement", "border", "nego_border_sharing", "nego_ddr"],
    "Resources": ["nego_land", "nego_water", "nego_cattle", "nego_movement"],
    "Governance": ["nego_power_sharing", "election", "nego_end_support", "nego_withdrawal"]
}

# Categorize purposes
def categorize_purpose(row):
    for group, columns in purpose_groups.items():
        if any(row[col] == 1 for col in columns if col in row):
            return group
    return "Other"

df["purpose_group"] = df.apply(categorize_purpose, axis=1)

# Define success groups
success_groups = {
    "Agreement Success": ["prenego_success", "nego_power_sharing_success", "nego_ddr_success", "election_success"],
    "Resource Success": ["nego_land_success", "nego_water_success", "nego_cattle_success"],
    "Other Success": ["monitor_peacekeeping_success", "reconciliation_success", "amnesty_success"]
}

# Categorize success metrics
def categorize_success(row):
    for group, columns in success_groups.items():
        if any(row[col] == 1 for col in columns if col in row):
            return group
    return "Other"

df["success_group"] = df.apply(categorize_success, axis=1)

# Analyze group sizes
print("Mediator Groups Distribution:")
print(df["mediator_group"].value_counts())

print("\nPurpose Groups Distribution:")
print(df["purpose_group"].value_counts())

print("\nSuccess Groups Distribution:")
print(df["success_group"].value_counts())

# Save the grouped dataset
df.to_csv("./grouped_dataset.csv", index=False)
