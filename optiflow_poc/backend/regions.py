# backend/regions.py

STORE_REGIONS = {
    # 1. Delhi NCR Cluster
    'Delhi Dwarka Sec 09': 'Delhi_NCR',
    'Delhi Rohini Ring Road Mall': 'Delhi_NCR',
    'Ghaziabad RDC': 'Delhi_NCR',
    'Noida Spectrum Mall': 'Delhi_NCR',
    'Noida Sec 50': 'Delhi_NCR',
    'Noida MOI': 'Delhi_NCR',
    'Noida GaurCity': 'Delhi_NCR',
    'Indirapuram Shakti Khand Eros Market': 'Delhi_NCR',
    'Gurgaon Sector 51 M2K': 'Delhi_NCR',
    'Gurgaon Sec 29': 'Delhi_NCR',
    'Gurgaon Dhanak Basti New Railway Road': 'Delhi_NCR',
    'Greater Noida West Nirala Estate': 'Delhi_NCR',
    'Ghaziabad Nehru Nagar': 'Delhi_NCR',
    'Faridabad Sec 16A': 'Delhi_NCR',
    'Delhi Shahdara': 'Delhi_NCR',
    'Delhi Pusa Road': 'Delhi_NCR',
    'Delhi Rajouri Garden': 'Delhi_NCR',
    'Delhi Preet Vihar Vikas Marg': 'Delhi_NCR',
    'Delhi Dwarka Vegas Mall Sec 14': 'Delhi_NCR',
    'Delhi Pitampura': 'Delhi_NCR',
    'Delhi Dwarka Krishna Mall': 'Delhi_NCR',
    'Delhi Ashok Vihar Phase II': 'Delhi_NCR',
    'Bahadurgarh Rohtak Delhi Road': 'Delhi_NCR',
    'Palwal New Colony': 'Delhi_NCR',
    'Delhi Vikaspuri Najafgarh Road': 'Delhi_NCR',
    'Delhi Safdarjung Enclave': 'Delhi_NCR',
    'LAJPAT NAGAR': 'Delhi_NCR',
    'Delhi Laxmi Nagar': 'Delhi_NCR',

    # 2. Mumbai Metro Cluster
    'Panvel Laxmi Eye': 'Mumbai_Metro',
    'Navi Mumbai Nerul ( Shivam )': 'Mumbai_Metro',
    'Mumbai Ghatkopar Dr Mehta Eye': 'Mumbai_Metro',
    'Mumbai Chembur Rushab Eye': 'Mumbai_Metro',
    'Kharghar Laxmi Eye': 'Mumbai_Metro',
    'Badlapur Kulgaon Drishti Eye': 'Mumbai_Metro',
    'Kamothe Laxmi Eye': 'Mumbai_Metro',
    'Dombivli (East) Laxmi Eye': 'Mumbai_Metro',

    # 3. Hyderabad Metro Cluster
    'Hyderabad Neo Retina (Abids)': 'Hyderabad_Metro',
    'Hyderabad Kukatpally Nizampet X Roads': 'Hyderabad_Metro',
    'Hyderabad Banjara Hills Dr Challa': 'Hyderabad_Metro',
    'Hyderabad Banjara Hills': 'Hyderabad_Metro',
    'Hyderabad Hayathnagar': 'Hyderabad_Metro',
    'Siddipet Gandhi Chowk Krishna Sai': 'Hyderabad_Metro',
    'Warangal Hanamkonda Kakathiya': 'Hyderabad_Metro',

    # 4. Gujarat Clusters
    'Ahemdabad CG Road': 'Ahmedabad',
    'Ahmedabad Naroda Road Saraswati Eye': 'Ahmedabad',
    'Surat Rander Road': 'Surat',
    'Surat City Light Road': 'Surat',
    'Vadodara Genda Circle': 'Vadodara',

    # 5. Rajasthan Clusters
    'Jaipur Vaishali Nagar': 'Jaipur',
    'Jaipur Malviya Nagar': 'Jaipur',
    'Jodhpur Sardarpura': 'Jodhpur',
    'Jodhpur Pal Road Paliwal Eye': 'Jodhpur',
    'Ajmer Ramganj': 'Ajmer',
    'Ajmer BK Kaul Nagar': 'Ajmer',
    'Sikar Police Line Road I Max': 'Sikar',
    'Jhunjhunu Indra Nagar': 'Jhunjhunu',

    # 6. Punjab/Chandigarh Tricity Cluster
    'Mohali Sector 62': 'Tricity',
    'Panchkula Sector 2': 'Tricity',
    'Patiala Randhawa Eye': 'Tricity',

    # 7. Other Hyperlocal Clusters
    'Kolkata Madhyamgram': 'Kolkata',
    'Kolkata AJC Bose Road': 'Kolkata',
    'Patna RPS Mod': 'Patna',
    'Patna Kankarbagh': 'Patna',
    'Srinagar Rainawari Fazili': 'Srinagar',
    'Srinagar Baghat Fazili': 'Srinagar',
    'Indore Vijay Nagar': 'Indore',
    'Indore Sapna Sangeeta Road': 'Indore',
    'Hisar Sec 14': 'Hisar',
    'Hisar Red Square Market': 'Hisar',
    'Guwahati Rukminigaon TRC': 'Guwahati',
    'Guwahati Bhangagarh': 'Guwahati',
    'Bhubneshwar Nayapalli': 'Bhubaneswar',
    'Agra Ashoka Plaza': 'Agra',
    'Kanpur Mall Road': 'Kanpur',
    'Moradabad Kanth Road': 'Moradabad',
    'Rewari Sector 5': 'Rewari',
    'Varanasi Mahmoorganj': 'Varanasi',
    'Vijayawada Mogalrajpuram': 'Vijayawada',
    
    # 8. Newly Added Stores (240726 Data)
    'Karnal Model Town': 'Karnal',
    'Dehradun Chakrata Road TEC': 'Dehradun',
    'Jabalpur Napier Town': 'Jabalpur',
    'Gwalior Lashkar Ratan Jyoti Netralaya': 'Gwalior',
    'Gorakhpur Mughlaha': 'Gorakhpur',
    'Prayagraj Tashkent Marg': 'Prayagraj',
    'Jammu BC Road Rehari Chungi': 'Jammu',
    'Bhopal Hoshangabad Road': 'Bhopal',
    'Lucknow Hazratganj SAM Eye': 'Lucknow',
    'Nashik Navkar Eye': 'Nashik',
    'Gaya Chanakyapuri Colony': 'Gaya',
    'Pune Satara Road Jhamwar Eye': 'Pune',
    'Siliguri Sevoke Road': 'Siliguri',
    'Bhiwani Circular Road': 'Bhiwani',
    'Ranchi Kutchery Road': 'Ranchi',
    'Jamshedpur Singhbhum': 'Jamshedpur',
    
    # Defaults
    'Corporate Office': 'Warehouse'
}

from allocation_engine import STORE_NAME_MAP

def get_store_region(store_name: str) -> str:
    """Returns the regional cluster ID for a given store. If none, defaults to the store name itself as a standalone cluster."""
    mapped_name = STORE_NAME_MAP.get(store_name, store_name)
    return STORE_REGIONS.get(mapped_name, mapped_name)

REGION_TO_ZONE_MAP = {
    'Delhi_NCR': 'North India',
    'Jaipur': 'North India',
    'Jodhpur': 'North India',
    'Ajmer': 'North India',
    'Sikar': 'North India',
    'Jhunjhunu': 'North India',
    'Tricity': 'North India',
    'Hisar': 'North India',
    'Srinagar': 'North India',
    'Agra': 'North India',
    'Kanpur': 'North India',
    'Moradabad': 'North India',
    'Rewari': 'North India',
    'Varanasi': 'North India',
    'Karnal': 'North India',
    'Dehradun': 'North India',
    'Gorakhpur': 'North India',
    'Prayagraj': 'North India',
    'Jammu': 'North India',
    'Lucknow': 'North India',
    'Bhiwani': 'North India',
    
    'Mumbai_Metro': 'West India',
    'Ahmedabad': 'West India',
    'Surat': 'West India',
    'Vadodara': 'West India',
    'Indore': 'West India',
    'Jabalpur': 'West India',
    'Gwalior': 'West India',
    'Bhopal': 'West India',
    'Nashik': 'West India',
    'Pune': 'West India',
    
    'Hyderabad_Metro': 'South India',
    'Vijayawada': 'South India',
    
    'Kolkata': 'East India',
    'Patna': 'East India',
    'Guwahati': 'East India',
    'Bhubaneswar': 'East India',
    'Gaya': 'East India',
    'Siliguri': 'East India',
    'Ranchi': 'East India',
    'Jamshedpur': 'East India',
    
    'Warehouse': 'Corporate'
}

def get_store_zone(region_name: str) -> str:
    """Returns the macro Zone (North, South, East, West) for a given region."""
    return REGION_TO_ZONE_MAP.get(region_name, 'Unassigned Zone')
