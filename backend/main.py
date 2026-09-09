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
# 4. INITIAL MOCK DATA (20 ร้านดังจริงรอบ ม.นเรศวร NU Edition)
# -------------------------------------------------------------
INITIAL_MENUS = [
    {
        "name": "ข้าวกะเพราหมูกรอบไข่ดาว",
        "category": "อาหารจานเดียว",
        "price": 50.0,
        "calories": 650,
        "spiciness": 2,
        "ingredients": "หมูกรอบ, ไข่ดาว, ใบกะเพรา, พริก",
        "restaurant_name": "ร้านอรอรรถรส",
        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
        "recipe_summary": "ทริก: เมนูที่รีวิวลูกค้าชมบ่อยที่สุดของร้าน หมูกรอบทอดใหม่ ไข่ดาวไข่แดงเยิ้ม ราคาเดิมแค่ 50 บาท",
        "random_count": 58
    },
    {
        "name": "ข้าวผัดกุ้ง",
        "category": "อาหารจานเดียว",
        "price": 40.0,
        "calories": 480,
        "spiciness": 1,
        "ingredients": "กุ้ง, ไข่, ข้าวสวย",
        "restaurant_name": "ร้านอรอรรถรส",
        "image_url": "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=600&q=80",
        "recipe_summary": "ทริก: จานเบสิกแต่คนสั่งประจำ กุ้งเด้งไม่คาว ราคาย่อมเยาที่สุดของร้านแค่ 40 บาท",
        "random_count": 64
    },
    {
        "name": "ต้มยำกระดูกหมูเข้มข้น",
        "category": "ต้ม/แกง",
        "price": 60.0,
        "calories": 320,
        "spiciness": 2,
        "ingredients": "กระดูกหมู, พริก, มะนาว",
        "restaurant_name": "ร้านอรอรรถรส",
        "image_url": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80",
        "recipe_summary": "ทริก: กระดูกหมูตัดเป็นชิ้นใหญ่รสจัดจ้าน สั่งคู่ข้าวกะเพราแล้วอิ่มคุ้มสุด",
        "random_count": 27
    },
    {
        "name": "หมูสามชั้นทอดกระเทียม",
        "category": "อาหารจานเดียว",
        "price": 60.0,
        "calories": 550,
        "spiciness": 0,
        "ingredients": "หมูสามชั้น, กระเทียม, ข้าวสวย",
        "restaurant_name": "Rustic Backyard",
        "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
        "recipe_summary": "ทริก: เมนูซิกเนเจอร์ที่ถูกชมมากที่สุดในรีวิวร้าน กรอบนอกนุ่มใน กระเทียมเจียวหอมทั้งจาน",
        "random_count": 45
    },
    {
        "name": "ปลาโดริ่ผัดกะเพรา",
        "category": "อาหารจานเดียว",
        "price": 65.0,
        "calories": 480,
        "spiciness": 2,
        "ingredients": "ปลาโดริ่, ใบกะเพรา, พริก",
        "restaurant_name": "Rustic Backyard",
        "image_url": "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80",
        "recipe_summary": "ทริก: เนื้อปลาโดริ่นุ่มไม่มีก้าง ผัดกะเพราสไตล์ร้านนี้แซ่บกำลังดีตามที่รีวิวลูกค้าแนะนำ",
        "random_count": 39
    },
    {
        "name": "หมูชาบูกระเทียม",
        "category": "อาหารจานเดียว",
        "price": 65.0,
        "calories": 500,
        "spiciness": 0,
        "ingredients": "หมูสไลซ์, กระเทียม, ข้าวสวย",
        "restaurant_name": "Rustic Backyard",
        "image_url": "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80",
        "recipe_summary": "ทริก: หมูสไลซ์บางนุ่มผัดกระเทียมหอมฟุ้ง เป็นอีกจานที่ลูกค้ารีวิวชมว่าอร่อยมาก",
        "random_count": 22
    },
    {
        "name": "ไก่ผัดเม็ดมะม่วงหิมพานต์",
        "category": "อาหารจานเดียว",
        "price": 70.0,
        "calories": 460,
        "spiciness": 0,
        "ingredients": "ไก่, เม็ดมะม่วงหิมพานต์, ข้าวสวย",
        "restaurant_name": "Have A Seat",
        "image_url": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80",
        "recipe_summary": "ทริก: หนึ่งในเมนูที่ลูกค้ารีวิวแนะนำให้ลอง ไก่นุ่มเม็ดมะม่วงหิมพานต์คั่วกรอบ",
        "random_count": 18
    },
    {
        "name": "แกงแดงไก่",
        "category": "ต้ม/แกง",
        "price": 75.0,
        "calories": 430,
        "spiciness": 2,
        "ingredients": "ไก่, กะทิ, พริกแกงแดง",
        "restaurant_name": "Have A Seat",
        "image_url": "https://images.unsplash.com/photo-1548943487-a2e4e43b4853?auto=format&fit=crop&w=600&q=80",
        "recipe_summary": "ทริก: กะทิเข้มข้นแบบไม่หวานจัด เผ็ดกำลังดี ลูกค้ารีวิวชมว่าราคาคุ้มมาก",
        "random_count": 19
    },
    {
        "name": "สปาเก็ตตี้คาโบนาร่า",
        "category": "เมนูเส้น",
        "price": 85.0,
        "calories": 620,
        "spiciness": 0,
        "ingredients": "เบคอน, ครีม, พาสต้า, ไข่แดง",
        "restaurant_name": "Have A Seat",
        "image_url": "https://images.unsplash.com/photo-1594998893017-36147cbcae05?auto=format&fit=crop&w=600&q=80",
        "recipe_summary": "ทริก: ทางเลือกสำหรับคนอยากเปลี่ยนบรรยากาศจากอาหารไทย รสชาติได้รับคำชมจากรีวิวจริง",
        "random_count": 26
    },
    {
        "name": "ข้าวกะเพราไก่กรอบพิเศษ",
        "category": "อาหารจานเดียว",
        "price": 55.0,
        "calories": 600,
        "spiciness": 2,
        "ingredients": "ไก่กรอบ, ใบกะเพรา, พริก",
        "restaurant_name": "Thai Food Diner",
        "image_url": "https://images.unsplash.com/photo-1569058242567-93de6f36f8e6?auto=format&fit=crop&w=600&q=80",
        "recipe_summary": "ทริก: เมนูพิเศษของร้านที่รีวิวลูกค้าบอกว่าราคาสูงกว่าปกตินิดหน่อยแต่รสชาติคุ้มค่า",
        "random_count": 37
    },
    {
        "name": "ข้าวแกงกะหรี่ไก่",
        "category": "ต้ม/แกง",
        "price": 50.0,
        "calories": 550,
        "spiciness": 1,
        "ingredients": "ไก่, พริกแกงกะหรี่, ข้าวสวย",
        "restaurant_name": "Thai Food Diner",
        "image_url": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
        "recipe_summary": "ทริก: แกงกะหรี่รสกลมกล่อม ลูกค้ารีวิวชมว่าราคาถูกแต่รสชาติเกินราคา",
        "random_count": 31
    },
    {
        "name": "ข้าวผัดจานด่วน",
        "category": "อาหารจานเดียว",
        "price": 40.0,
        "calories": 450,
        "spiciness": 0,
        "ingredients": "ไข่, ข้าวสวย, ผักรวม",
        "restaurant_name": "The fast อาหารจานด่วน",
        "image_url": "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=600&q=80",
        "recipe_summary": "ทริก: ทำเร็วมากตามชื่อร้าน เหมาะมื้อรีบๆ ก่อนเข้าเรียน รีวิวลูกค้าชมความไวและรสชาติ",
        "random_count": 52
    },
    {
        "name": "บะหมี่ผัดกะเพรา",
        "category": "เมนูเส้น",
        "price": 45.0,
        "calories": 420,
        "spiciness": 2,
        "ingredients": "บะหมี่, ใบกะเพรา, พริก",
        "restaurant_name": "แลบัว ณ มอนอ",
        "image_url": "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80",
        "recipe_summary": "ทริก: นั่งกินริมบึงบัว บรรยากาศชิล เมนูนี้ถูกรีวิวลูกค้าแนะนำโดยตรง",
        "random_count": 50
    },
    {
        "name": "ส้มตำหลวงพระบาง",
        "category": "อาหารจานเดียว",
        "price": 50.0,
        "calories": 180,
        "spiciness": 3,
        "ingredients": "มะละกอ, พริก, ปลาร้า",
        "restaurant_name": "แลบัว ณ มอนอ",
        "image_url": "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=600&q=80",
        "recipe_summary": "ทริก: สูตรเฉพาะของร้าน เผ็ดแซ่บ รสจัดจ้านตามที่ลูกค้ารีวิวการันตี",
        "random_count": 15
    },
    {
        "name": "บะหมี่ต้มยำทะเลรวมมิตร",
        "category": "เมนูเส้น",
        "price": 60.0,
        "calories": 480,
        "spiciness": 2,
        "ingredients": "กุ้ง, ปลาหมึก, ลูกชิ้น, บะหมี่, ผักสด",
        "restaurant_name": "ตำซวดลวด",
        "image_url": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
        "recipe_summary": "ทริก: ซุปรสกลมกล่อมเปรี้ยวหวานเค็มเผ็ดครบ เส้นนุ่ม ท็อปด้วยกุ้ง ปลาหมึก ลูกชิ้น ผักสด โรยหอมเจียวถั่วลิสงแน่นชาม",
        "random_count": 48
    },
    {
        "name": "หมูสามชั้นผัดกรอบ",
        "category": "อาหารจานเดียว",
        "price": 60.0,
        "calories": 540,
        "spiciness": 1,
        "ingredients": "หมูสามชั้น, กระเทียม, ข้าวสวย",
        "restaurant_name": "ชูรส มอนอ",
        "image_url": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
        "recipe_summary": "ทริก: หมูสามชั้นทอดกรอบผัดจนเข้าเนื้อ ลูกค้ารีวิวบอกว่าเป็นร้านโปรดที่กลับมากินซ้ำบ่อยที่สุด",
        "random_count": 44
    },
    {
        "name": "กะเพราไก่",
        "category": "อาหารจานเดียว",
        "price": 50.0,
        "calories": 460,
        "spiciness": 2,
        "ingredients": "ไก่สับ, ใบกะเพรา, พริก",
        "restaurant_name": "ชูรส มอนอ",
        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
        "recipe_summary": "ทริก: จุดขายของร้านคือไม่ใส่ถั่วฝักยาวปนแบบร้านอื่น เน้นไก่สับกับใบกะเพราล้วนๆ",
        "random_count": 33
    },
    {
        "name": "เย็นตาโฟแห้ง",
        "category": "เมนูเส้น",
        "price": 50.0,
        "calories": 420,
        "spiciness": 1,
        "ingredients": "เต้าหู้ยี้แดง, บะหมี่, ลูกชิ้นปลา, ผักบุ้ง",
        "restaurant_name": "Plearn Restaurant",
        "image_url": "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80",
        "recipe_summary": "ทริก: เมนูที่รีวิวลูกค้าแนะนำเป็นพิเศษ กินคู่บรรยากาศเพลงเก่าชิลๆ ยามค่ำ",
        "random_count": 35
    },
    {
        "name": "หม้อไฟไข่ตุ๋นทะเลรวมมิตร",
        "category": "ต้ม/แกง",
        "price": 120.0,
        "calories": 380,
        "spiciness": 0,
        "ingredients": "ไข่, กุ้ง, ปลาหมึก",
        "restaurant_name": "Plearn Restaurant",
        "image_url": "https://images.unsplash.com/photo-1552611052-33e04de081de?auto=format&fit=crop&w=600&q=80",
        "recipe_summary": "ทริก: ไข่ตุ๋นเนื้อเนียนนุ่มใส่ของทะเลแน่น เหมาะกินแบ่งกันหลายคน อีกหนึ่งเมนูที่ถูกรีวิวชมตรงๆ",
        "random_count": 13
    },
    {
        "name": "เค้กเบิร์นบาสก์",
        "category": "ของหวาน",
        "price": 65.0,
        "calories": 350,
        "spiciness": 0,
        "ingredients": "ครีมชีส, ไข่, น้ำตาล, วิปปิ้งครีม",
        "restaurant_name": "warehouse.nu",
        "image_url": "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=600&q=80",
        "recipe_summary": "ทริก: รีวิวลูกค้าชมว่าขอบเค้กมีเท็กซ์เจอร์ดี ตรงกลางครีมมี่ไม่หวานเกินไป ถือเป็นเมนูซิกเนเจอร์ของร้าน",
        "random_count": 41
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