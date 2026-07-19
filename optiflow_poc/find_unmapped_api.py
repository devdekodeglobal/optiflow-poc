import urllib.request
import json

try:
    response = urllib.request.urlopen('http://127.0.0.1:8000/api/regions')
    data = json.loads(response.read())
    
    unassigned = []
    for reg in data.get('regions', []):
        if reg.get('zone_name') == 'Unassigned Zone':
            unassigned.append(reg.get('region_name'))
            
    print("UNASSIGNED REGIONS:")
    for u in unassigned:
        print(u)
except Exception as e:
    print(f"Error: {e}")

