from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, desc
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import Optional, List
import random

# -------------------------------------------------------------
# 1. DATABASE CONFIGURATION (SQLite)
# -------------------------------------------------------------
DATABASE_URL = "sqlite:///./kinraidee.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# -------------------------------------------------------------
# 2. MODEL TABLE (SQLAlchemy)
# -------------------------------------------------------------
class MenuModel(Base):
    __tablename__ = "menus"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    calories = Column(Integer, nullable=False)
    spiciness = Column(Integer, default=0)              # 0 ถึง 3
    ingredients = Column(String, default="")           # คั่นด้วยจุลภาค เช่น "ไข่, หมูสับ, กะเพรา"
    recipe_summary = Column(Text, default="")
    restaurant_name = Column(String, default="")
    image_url = Column(String, default="")
    random_count = Column(Integer, default=0)           # นับจำนวนครั้งที่ถูกสุ่ม

Base.metadata.create_all(bind=engine)

# -------------------------------------------------------------
# 3. PYDANTIC SCHEMAS
# -------------------------------------------------------------
class MenuSchemaBase(BaseModel):
    name: str
    category: str
    price: float
    calories: int
    spiciness: int = 0
    ingredients: str = ""
    recipe_summary: str = ""
    restaurant_name: str = ""
    image_url: str = ""

class MenuCreate(MenuSchemaBase):
    pass

class MenuUpdate(MenuSchemaBase):
    pass

class MenuResponse(MenuSchemaBase):
    id: int
    random_count: int

    class Config:
        from_attributes = True

# -------------------------------------------------------------
# 4. INITIAL MOCK DATA
# -------------------------------------------------------------
INITIAL_MENUS = [
    {
        "name": "ข้าวกะเพราหมูกรอบไข่ดาว",
        "category": "อาหารจานเดียว",
        "price": 65.0,
        "calories": 650,
        "spiciness": 3,
        "ingredients": "หมูกรอบ, ใบกะเพรา, พริก, กระเทียม, ไข่",
        "recipe_summary": "ผัดพริกกระเทียมให้หอม ใส่หมูกรอบ ปรุงรสด้วยซอสและน้ำมันหอย ใส่ใบกะเพรา ทอดไข่ดาวกรอบๆ",
        "restaurant_name": "ร้านกะเพราตาหนวด",
        "image_url": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80",
        "random_count": 12
    },
    {
        "name": "ต้มยำกุ้งน้ำข้น",
        "category": "ต้ม/แกง",
        "price": 120.0,
        "calories": 320,
        "spiciness": 2,
        "ingredients": "กุ้ง, เห็ดฟาง, ข่า, ตะไคร้, ใบมะกรูด, นมข้นจืด, มะนาว",
        "recipe_summary": "ต้มน้ำสมุนไพรให้เดือด ใส่กุ้งและเห็ด ปรุงรสด้วยน้ำพริกเผา น้ำปลา มะนาว และเติมนมข้นจืด",
        "restaurant_name": "ครัวต้มยำโบราณ",
        "image_url": "https://images.unsplash.com/photo-1548943487-a2e4e43b4853?auto=format&fit=crop&w=600&q=80",
        "random_count": 8
    },
    {
        "name": "ผัดซีอิ๊วหมูเส้นใหญ่",
        "category": "เมนูเส้น",
        "price": 55.0,
        "calories": 540,
        "spiciness": 0,
        "ingredients": "เส้นใหญ่, หมูชิ้น, คะน้า, ไข่, ซีอิ๊วดำ",
        "recipe_summary": "ผัดหมูกับไข่ให้สุก ใส่เส้นใหญ่ คะน้า ปรุงรสด้วยซีอิ๊วขาว ซีอิ๊วดำ และผัดให้มีกลิ่นกระทะไหม้เบาๆ",
        "restaurant_name": "ราดหน้ายอดผักนายเตี้ย",
        "image_url": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
        "random_count": 5
    },
    {
        "name": "ข้าวผัดไข่ไก่กระเทียม",
        "category": "อาหารจานเดียว",
        "price": 45.0,
        "calories": 480,
        "spiciness": 0,
        "ingredients": "ข้าวสวย, ไข่, ไก่, กระเทียม, ต้นหอม",
        "recipe_summary": "เจียวกระเทียม ผัดเนื้อไก่จนสุก ใส่ไข่ยีให้ทั่ว ใส่ข้าวสวย ปรุงรส โรยต้นหอมซอย",
        "restaurant_name": "ครัวลุงเอก ข้าวผัดโบราณ",
        "image_url": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80",
        "random_count": 9
    },
    {
        "name": "มาม่าต้มยำหมูสับรวมมิตร",
        "category": "เมนูเส้น",
        "price": 50.0,
        "calories": 420,
        "spiciness": 2,
        "ingredients": "เส้นมาม่า, หมูสับ, ไข่, มะนาว, พริกป่น",
        "recipe_summary": "ลวกเส้นมาม่าและหมูสับ ปรุงรสน้ำซุปด้วยเครื่องปรุงมาม่า มะนาว พริกป่น ตอกไข่ลวกด้านบน",
        "restaurant_name": "เจ๊โอว ต้มยำดึก",
        "image_url": "https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=600&q=80",
        "random_count": 15
    },
    {
        "name": "อกไก่ผัดบรอกโคลีเพื่อสุขภาพ",
        "category": "คลีน/สุขภาพ",
        "price": 70.0,
        "calories": 280,
        "spiciness": 0,
        "ingredients": "อกไก่, บรอกโคลี, แครอท, กระเทียม",
        "recipe_summary": "ผัดอกไก่ด้วยน้ำมันมะกอกเล็กน้อย ใส่บรอกโคลี แครอท ปรุงรสด้วยซีอิ๊วโซเดียมต่ำ",
        "restaurant_name": "Healthy Clean Food Box",
        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
        "random_count": 4
    },
    {
        "name": "แกงเขียวหวานไก่ยอดมะพร้าว",
        "category": "ต้ม/แกง",
        "price": 60.0,
        "calories": 450,
        "spiciness": 2,
        "ingredients": "ไก่, กะทิ, ยอดมะพร้าว, พริกแกงเขียวหวาน, โหระพา",
        "recipe_summary": "ผัดพริกแกงกับหัวกะทิให้แตกมัน ใส่ไก่ ยอดมะพร้าว เติมหางกะทิ ปรุงรสหวานเค็ม โรยใบโหระพา",
        "restaurant_name": "ครัวแม่ทองคำ อาหารไทย",
        "image_url": "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?auto=format&fit=crop&w=600&q=80",
        "random_count": 3
    },
    {
        "name": "ไข่เจียวหมูสับทรงเครื่อง",
        "category": "อาหารจานเดียว",
        "price": 40.0,
        "calories": 410,
        "spiciness": 0,
        "ingredients": "ไข่, หมูสับ, หอมหัวใหญ่, ต้นหอม",
        "recipe_summary": "ตีไข่ไก่ผสมหมูสับ หอมใหญ่ ต้นหอม ปรุงรสด้วยน้ำปลา ทอดในน้ำมันร้อนจัดจนฟูกรอบสีเหลืองทอง",
        "restaurant_name": "ร้านป้าสมศรี อาหารตามสั่ง",
        "image_url": "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80",
        "random_count": 11
    }
]

def init_mock_data():
    db = SessionLocal()
    try:
        count = db.query(MenuModel).count()
        if count == 0:
            for item in INITIAL_MENUS:
                menu = MenuModel(**item)
                db.add(menu)
            db.commit()
    finally:
        db.close()

# -------------------------------------------------------------
# 5. FASTAPI APP & CORS
# -------------------------------------------------------------
app = FastAPI(title="KinRaiDee Backend API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
def startup_event():
    init_mock_data()

# -------------------------------------------------------------
# 6. API ENDPOINTS
# -------------------------------------------------------------

# ดึงรายการเมนูทั้งหมด (รองรับ Search & Category filter)
@app.get("/api/menus", response_model=List[MenuResponse])
def get_menus(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(MenuModel)
    if search:
        query = query.filter(MenuModel.name.contains(search) | MenuModel.ingredients.contains(search))
    if category and category != "ทั้งหมด":
        query = query.filter(MenuModel.category == category)
    return query.order_by(desc(MenuModel.id)).all()

# สุ่มเมนู 1 รายการ และบวก random_count เพิ่ม 1
@app.get("/api/menus/random", response_model=MenuResponse)
def get_random_menu(db: Session = Depends(get_db)):
    menus = db.query(MenuModel).all()
    if not menus:
        raise HTTPException(status_code=404, detail="ไม่มีเมนูในระบบ")
    chosen = random.choice(menus)
    chosen.random_count += 1
    db.commit()
    db.refresh(chosen)
    return chosen

# สถิติสำหรับหน้า Admin Dashboard
@app.get("/api/admin/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    menus = db.query(MenuModel).all()
    total_menus = len(menus)
    
    if total_menus == 0:
        return {
            "total_menus": 0,
            "most_randomed_menu": "ไม่มีข้อมูล",
            "top_category": "ไม่มีข้อมูล"
        }
    
    # เมนูที่ถูกสุ่มบ่อยที่สุด
    most_randomed = max(menus, key=lambda m: m.random_count, default=None)
    most_randomed_text = f"{most_randomed.name} ({most_randomed.random_count} ครั้ง)" if most_randomed and most_randomed.random_count > 0 else "ยังไม่มีการสุ่ม"

    # หมวดหมู่ที่มีเยอะที่สุด
    cat_counts = {}
    for m in menus:
        cat_counts[m.category] = cat_counts.get(m.category, 0) + 1
    top_cat = max(cat_counts, key=cat_counts.get) if cat_counts else "ไม่มีข้อมูล"

    return {
        "total_menus": total_menus,
        "most_randomed_menu": most_randomed_text,
        "top_category": f"{top_cat} ({cat_counts.get(top_cat, 0)} เมนู)"
    }

# ดึงเมนูเดี่ยวตาม ID
@app.get("/api/menus/{menu_id}", response_model=MenuResponse)
def get_menu(menu_id: int, db: Session = Depends(get_db)):
    menu = db.query(MenuModel).filter(MenuModel.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="ไม่พบเมนูที่ระบุ")
    return menu

# เพิ่มเมนูใหม่
@app.post("/api/menus", response_model=MenuResponse)
def create_menu(menu_in: MenuCreate, db: Session = Depends(get_db)):
    menu = MenuModel(**menu_in.dict())
    db.add(menu)
    db.commit()
    db.refresh(menu)
    return menu

# แก้ไขเมนูเดิม
@app.put("/api/menus/{menu_id}", response_model=MenuResponse)
def update_menu(menu_id: int, menu_in: MenuUpdate, db: Session = Depends(get_db)):
    menu = db.query(MenuModel).filter(MenuModel.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="ไม่พบเมนูที่ต้องการแก้ไข")
    
    for key, value in menu_in.dict().items():
        setattr(menu, key, value)
    
    db.commit()
    db.refresh(menu)
    return menu

# ลบเมนู
@app.delete("/api/menus/{menu_id}")
def delete_menu(menu_id: int, db: Session = Depends(get_db)):
    menu = db.query(MenuModel).filter(MenuModel.id == menu_id).first()
    if not menu:
        raise HTTPException(status_code=404, detail="ไม่พบเมนูที่ต้องการลบ")
    db.delete(menu)
    db.commit()
    return {"message": "ลบเมนูเรียบร้อยแล้ว", "id": menu_id}