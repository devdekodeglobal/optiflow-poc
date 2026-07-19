import sys
import os

# Need to append backend path to load python modules
sys.path.append(os.path.abspath("backend"))

from regions import STORE_REGIONS
import pandas as pd

# Let's read the raw stores from the CSV to see what we have
df = pd.read_csv("backend/data/store_master.csv")
all_stores = df['Store Name'].unique()

unmapped = []
for s in all_stores:
    # Also check STORE_NAME_MAP from allocation_engine if possible, but let's just check STORE_REGIONS
    if s not in STORE_REGIONS:
        unmapped.append(s)

print("UNMAPPED STORES:")
for u in unmapped:
    print(u)
