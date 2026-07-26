from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from enum import Enum


class MatchType(str, Enum):
    EXACT = "exact"
    SIMILAR = "similar"
    SUBSTITUTE = "substitute"
    UNRESOLVED = "unresolved"


class ItemAttributes(BaseModel):
    model: str = ""
    brand: str = ""
    gender: str = ""
    color: str = ""
    size: str = ""
    frametype: str = ""
    shape: str = ""
    material: str = ""


class UploadStatus(BaseModel):
    planogram: bool = False
    sales: bool = False
    stock: bool = False
    planogram_rows: int = 0
    sales_rows: int = 0
    stock_rows: int = 0
    warehouse_skus: int = 0
    last_run_at: Optional[str] = None


class AllocationItem(BaseModel):
    gap_id: int = 0
    store_name: str
    store_category: str
    store_type: str
    brand_code: str
    brand_name: str
    commodity: str
    facing: float
    back_stock: float
    current_soh: float
    deficit: float
    
    initial_gap: float = 0.0
    remaining_gap: float = 0.0
    
    region: Optional[str] = None
    zone: Optional[str] = None
    allocated_qty: int = 0
    match_type: MatchType = MatchType.UNRESOLVED
    mrp: float = 0.0
    
    # Attribute reasoning info (money shot)
    requested_item_code: Optional[str] = None
    allocated_item_code: Optional[str] = None
    allocated_item_name: Optional[str] = None
    allocated_barcode: Optional[str] = None
    requested_attributes: Optional[ItemAttributes] = None
    allocated_attributes: Optional[ItemAttributes] = None
    match_reason: str = ""
    color_limit_warning: bool = False
    
    # Stock tracking
    initial_wh_stock: int = 0
    remaining_wh_stock: int = 0
    initial_gap: float = 0
    remaining_gap: float = 0


class AllocationSummary(BaseModel):
    total_stores: int = 0
    total_deficit_lines: int = 0
    exact_matches: int = 0
    similar_matches: int = 0
    brand_fallbacks: int = 0
    unresolved: int = 0
    total_items_allocated: int = 0
    stores_with_deficits: int = 0
    brands_processed: int = 0
    total_target_deficit: int = 0
    total_soh: int = 0
    total_retail_value: float = 0.0
    tier_fulfillment: Dict[str, Dict[str, float]] = Field(default_factory=dict)
    brands: List[Dict] = Field(default_factory=list)
    last_run_at: Optional[str] = None


class AllocationResponse(BaseModel):
    summary: AllocationSummary
    allocations: List[AllocationItem]
