# ShopSphere — Backend Architecture & Structure Documentation (Hindi / Hinglish)

यह दस्तावेज़ ShopSphere के पूरे बैकएंड आर्किटेक्चर, फोल्डर स्ट्रक्चर, रिक्वेस्ट लाइफसाइकिल और रोल-बेस्ड एक्सेस कंट्रोल (RBAC) को आसान और स्पष्ट हिंग्लिश में समझाता है।

---

## 1. आर्किटेक्चर का ओवरव्यू (Modular Monolith)

ShopSphere का बैकएंड **Modular Monolith** पैटर्न पर बनाया गया है। इसमें माइक्रोसर्विसेज की गैर-ज़रूरी जटिलता (network latency, distributed transaction failure) से बचते हुए, कोडबेस को डोमेन और रोल्स के आधार पर साफ़-सुथरे लेयर्स में विभाजित किया गया है।

```
Client Request (Browser / App)
       │
       ▼
[Middlewares Layer] (Helmet -> CORS -> Rate Limiter -> Cookie/Body Parser -> Auth/RBAC -> Zod Validator)
       │
       ▼
[Routes Layer] (src/routes/)
       │
       ▼
[Controllers Layer] (src/controllers/)
       │
       ▼
[Services Layer] (src/services/ — Real Business Logic & Calculations)
       │
       ▼
[Repositories Layer] (src/repositories/ — BaseRepository & Domain Queries)
       │
       ▼
[Database Models] (src/models/ — Mongoose Schemas & Indexes)
       │
       ▼
MongoDB Database
```

---

## 2. डायरेक्टरी स्ट्रक्चर और हर फोल्डर का काम

### `src/config/`
- **`env.js`**: एनवायरनमेंट वेरिएबल्स को लोड और वैलिडेट करता है। अगर ज़रूरी कीज़ मिसिंग हों तो वार्निंग देता है।
- **`database.js`**: MongoDB Mongoose कनेक्शन को सुरक्षित तरीके से हैंडल करता है और रिकनेक्शन लिसनर्स सेट करता है।
- **`redis.js`**: Redis क्लाइंट को इनिशियलाइज़ करता है। अगर Redis क्रेडेंशियल्स उपलब्ध न हों, तो यह क्रैश होने के बजाय ऑटोमैटिकली इन-मेमोरी फ़ालबैक मोड में चलता है।
- **`cloudinary.js`**: इमेज और बैनर अपलोड्स के लिए Cloudinary SDK को कॉन्फ़िगर करता है।
- **`razorpay.js`**: ऑनलाइन पेमेंट्स के लिए Razorpay SDK इंस्टेंस बनाता है।
- **`mail.js`**: Nodemailer SMTP ट्रांसपोर्टर (OTP, वेलकम ईमेल, आर्डर कन्फर्मेशन)।
- **`cors.js`**: CORS पालिसी और अलाउड ओरिजिन सेट करता है।
- **`logger.js`**: Winston स्ट्रक्चर्ड लॉगर (कलरफुल कंसोल और प्रोडक्शन JSON लॉग्स)।
- **`security.js`**: Helmet हेडर और Express Rate Limiter।
- **`socket.js`**: Socket.IO सर्वर, JWT ऑथेंटिकेशन और पर्सनल/कन्वर्सेशन रूम्स।

### `src/constants/`
- **`roles.constant.js`**: `super_admin`, `admin`, `vendor`, `user` रोल्स।
- **`permissions.constant.js`**: बारीक परमिशन्स (उदा. `manage:users`, `moderate:products`)।
- **`orderStatus.constant.js`**: आर्डर के सभी स्टेटस (`pending`, `confirmed`, `processing`, `packed`, `shipped`, `delivered`, `cancelled`, आदि)।
- **`paymentStatus.constant.js`**: पेमेंट स्टेटस (`pending`, `success`, `failed`, `refunded`, आदि)।
- **`productStatus.constant.js`**: प्रोडक्ट मॉडरेशन स्टेटस (`draft`, `pending_approval`, `published`, `rejected`, `archived`)।
- **`vendorStatus.constant.js`**: वेंडर एप्लीकेशन स्टेटस (`pending`, `under_review`, `approved`, `rejected`, `suspended`)।

### `src/models/`
34 Mongoose मॉडल्स जो बिज़नेस लॉजिक और डेटाबेस रिलेशनशिप्स को दर्शाते हैं:
- यूज़र ऑथ: `User`, `Role`, `Permission`
- वेंडर सिस्टम: `Vendor`, `VendorRequest`, `VendorEarnings`, `VendorPayout`
- कैटलॉग: `Product`, `ProductVariant`, `Category`, `Brand`, `ProductReview`
- शॉपिंग: `Cart`, `Wishlist`, `Address`, `Order`, `OrderItem`
- पेमेंट्स: `Payment`, `Refund`, `Coupon`, `CouponUsage`
- इन्वेंटरी: `Inventory`, `StockMovement`, `Shipment`, `ReturnRequest`
- ऑपरेशन्स: `Banner`, `Tax`, `ShippingZone`, `Notification`, `SupportTicket`, `Conversation`, `Message`, `RecentlyViewed`, `AuditLog`

### `src/repositories/`
- **`BaseRepository.js`**: जेनेरिक CRUD मेथड्स (`find`, `findById`, `create`, `updateById`, `deleteById`, `paginate`, `count`) प्रदान करता है।
- डोमेन रिपॉजिटरीज (जैसे `ProductRepository`, `OrderRepository`, `UserRepository`) डेटाबेस ऑपरेशन्स को सर्विसेज से अलग रखती हैं।

### `src/services/`
असली बिज़नेस लॉजिक इसी लेयर में लिखा गया है:
1. **`common/`**: पब्लिक प्रोडक्ट्स, कैटेगरी, ब्रांड्स, रिव्यु, चैट, ऑथेंटिकेशन।
2. **`customer/`**: प्रोफाइल, एड्रेस, कार्ट रिकैलकुलेशन, आर्डर प्लेसमेंट, पेमेंट वेरिफिकेशन, सपोर्ट टिकट्स।
3. **`vendor/`**: वेंडर स्टोर मैनेजमेंट, प्रोडक्ट CRUD, स्टॉक एडजस्टमेंट, स्टोर आर्डर्स फुलफिलमेंट, पेआउट रिक्वेस्ट्स।
4. **`admin/`**: यूज़र मैनेजमेंट, वेंडर अप्रूवल, प्रोडक्ट मॉडरेशन, रिफंड प्रोसेसिंग, रिपोर्ट्स।
5. **`superAdmin/`**: एडमिन अकाउंट्स क्रिएशन, रोल्स, परमिशन्स, टैक्स और शिपिंग रूल्स, सिस्टम सेटिंग्स।

### `src/middlewares/`
- **`auth.middleware.js`**: Bearer JWT टोकन या कुकी को वैलिडेट करता है और `req.user` सेट करता है।
- **`role.middleware.js`**: रोल-बेस्ड चेक्स (`requireAdmin`, `requireVendor`, `requireSuperAdmin`)।
- **`permission.middleware.js`**: RBAC परमिशन्स को वेरीफाई करता है।
- **`ownership.middleware.js`**: सुनिश्चित करता है कि वेंडर सिर्फ अपने प्रोडक्ट और कस्टमर सिर्फ अपने आर्डर देख/बदल सके।
- **`validate.middleware.js`**: Zod स्कीमा से बॉडी, क्वेरी और पैराम्स को वैलिडेट करता है।
- **`upload.middleware.js`**: Multer मेमोरी स्टोरेज इमेज अपलोड्स के लिए।
- **`error.middleware.js`**: सेंट्रलाइज्ड एरर हैंडलर। Mongoose Duplicate Key (11000), CastError और JWT एक्सपायरी को साफ़ JSON में बदलता है।

---

## 3. रोल-बेस्ड आर्किटेक्चर (RBAC) के नियम

1. **Super Admin**:
   - पूरे सिस्टम पर नियंत्रण।
   - नए एडमिन बना सकता है, रोल्स और परमिशन्स बदल सकता है।
   - ग्लोबल ऑडिट लॉग्स और टैक्स/शिपिंग नियम सेट करता है।

2. **Admin**:
   - स्टोर के सामान्य कामकाज को संभालता है।
   - वेंडर की रिक्वेस्ट को अप्रूव/रिजेक्ट करता है।
   - प्रोडक्ट्स को मॉडरेट करता है (अप्रूव होने के बाद ही प्रोडक्ट लाइव होता है)।
   - किसी भी आर्डर का रिफंड प्रोसेस कर सकता है।

3. **Vendor**:
   - केवल अपनी दुकान (Store) और अपने प्रोडक्ट्स को मैनेज कर सकता है।
   - किसी दूसरे वेंडर का डेटा या वित्तीय रिकॉर्ड एक्सेस नहीं कर सकता।
   - जब तक एडमिन प्रोडक्ट को अप्रूव नहीं करता, स्टेटस `pending_approval` रहता है।

4. **Customer (User)**:
   - सिर्फ अपने कार्ट, विशलिस्ट, आर्डर्स और प्रोफाइल को एक्सेस कर सकता है।
   - सर्वर प्राइसिंग को फाइनल मानता है; फ्रंटएंड से भेजी गई किसी भी कीमत पर भरोसा नहीं किया जाता।

---

## 4. पेमेंट और वेबहुक सुरक्षा (Razorpay)

1. **सर्वर-साइड टोटल कैलकुलेशन**:
   - कार्ट के आइटम्स की मौजूदा कीमत डेटाबेस से ली जाती है।
   - जीएसटी टैक्स और शिपिंग शुल्क सर्वर पर जुड़ते हैं।
   - कूपन डिस्काउंट सर्वर-साइड वैलिडेट होता है।
2. **सिग्नेचर वेरिफिकेशन**:
   - पेमेंट सक्सेस होने पर फ्रंटएंड से आया `razorpay_signature` बैकएंड पर `crypto.createHmac('sha256', secret)` से टेस्ट किया जाता है।
3. **Idempotency**:
   - वेबहुक या पेमेंट कॉल दोबारा आने पर एक ही आर्डर दो बार मार्क नहीं होता और न ही वेंडर को डबल क्रेडिट जाता है।

---

## 5. सर्वर कैसे चलाएं (Commands)

```bash
# डिपेंडेंसी इंस्टॉल करें
npm install

# डेटाबेस में डिफॉल्ट रोल्स, सुपर एडमिन और कैटेगरीज़ सीड करें
npm run seed

# सिंटैक्स और आर्किटेक्चर चेक करें
npm run check

# टेस्ट चलाएं
npm test

# डेवलपमेंट सर्वर स्टार्ट करें
npm run dev
```
