# Debug script to print email bodies as constructed by app.py
from datetime import datetime

def build_bodies(items, total_price, buyer_name='Test Buyer'):
    lines = []
    for it in items:
        cname = it.get('crop_name') or ''
        var = it.get('variety') or it.get('Variety') or ''
        qty = it.get('order_quantity') or it.get('quantity') or it.get('quantity_kg') or ''
        price = it.get('total') or (float(it.get('price_per_kg') or 0) * float(qty or 0))
        lines.append((cname, var, qty, price, it.get('farmer_name') or it.get('seller_name') or ''))

    en_blocks = []
    for cname, var, qty, price, fname in lines:
        en_blocks.append(f"* Crop Name: {cname}\n* Variety: {var}\n* Quantity Purchased: {qty}\n* Total Price: ₹{float(total_price or 0):.2f}\n")
    en_body = (
        f"Dear {buyer_name or ''},\n\n"
        "Thank you for completing your purchase on AgriAI! 🌱\n\n"
        "We are pleased to inform you that your purchase has been successfully confirmed. The selected crop(s) have been purchased from the farmer(s), and the transaction details have been securely recorded on our platform.\n\n"
        "Purchase Details:\n\n"
        + ('\n'.join(en_blocks))
        + "\nYou can view and download the invoice from the History section of your account for complete transaction details.\n\n"
        "The farmer(s) have been notified about this purchase and will proceed with the next steps as per the agreed terms.\n\n"
        "If you have any questions or need assistance, please reach out to us using the Contact Us section on the platform.\n\n"
        "Thank you for choosing AgriAI – an AI-Enhanced Contract Farming and Farmer Advisory System.\n\n"
        "Warm regards,\nThe AgriAI Team\n"
    )

    hi_blocks = []
    for cname, var, qty, price, fname in lines:
        hi_blocks.append(f"* फसल का नाम: {cname}\n* किस्म: {var}\n* खरीदी गई मात्रा: {qty}\n* कुल मूल्य: ₹{float(total_price or 0):.2f}\n")
    hi_body = (
        f"प्रिय {buyer_name or ''},\n\n"
        "AgriAI पर अपनी खरीद पूरी करने के लिए धन्यवाद! 🌱\n\n"
        "हमें यह बताते हुए खुशी हो रही है कि आपकी खरीद सफलतापूर्वक पुष्टि हो गई है। चयनित फसल(ें) किसान(ओं) से खरीदी जा चुकी हैं और लेन-देन से संबंधित सभी विवरण हमारे प्लेटफ़ॉर्म पर सुरक्षित रूप से दर्ज कर लिए गए हैं।\n\n"
        "खरीद विवरण:\n\n"
        + ('\n'.join(hi_blocks))
        + "\nआप अपने खाते के 'History' (इतिहास) अनुभाग से पूरा लेन-देन विवरण देखकर इनवॉइस डाउनलोड कर सकते हैं।\n\n"
        "यदि आपके कोई प्रश्न हों या आपको किसी सहायता की आवश्यकता हो, तो कृपया हमारे प्लेटफ़ॉर्म के 'Contact Us' (संपर्क करें) अनुभाग के माध्यम से हमसे संपर्क करें।\n\n"
        "AgriAI – एक एआई-सक्षम अनुबंध कृषि और किसान परामर्श प्रणाली को चुनने के लिए धन्यवाद।\n\n"
        "सादर,\nAgriAI टीम\n"
    )

    kn_blocks = []
    for cname, var, qty, price, fname in lines:
        kn_blocks.append(f"* ಬೆಳೆ ಹೆಸರು: {cname}\n* ಜಾತಿ: {var}\n* ಖರೀದಿಸಿದ ಪ್ರಮಾಣ: {qty}\n* ಒಟ್ಟು ಮೊತ್ತ: ₹{float(total_price or 0):.2f}\n")
    kn_body = (
        f"ಪ್ರಿಯ {buyer_name or ''},\n\n"
        "AgriAI ನಲ್ಲಿ ನಿಮ್ಮ ಖರೀದಿಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು! 🌱\n\n"
        "ನಿಮ್ಮ ಖರೀದಿ ಯಶಸ್ವಿಯಾಗಿ ದೃಢೀಕರಿಸಲಾಗಿದೆ. ಆಯ್ಕೆ ಮಾಡಲಾದ ಬೆಳೆ(ಗಳು) ರೈತರಿಂದ ಖರೀದಿಯಾಗಿವೆ ಮತ್ತು ವ್ಯವಹಾರದ ವಿವರಗಳು ನಮ್ಮ ವೇದಿಕೆಯಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ದಾಖಲಾಗಿವೆ.\n\n"
        "ಖರೀದಿ ವಿವರಗಳು:\n\n"
        + ('\n'.join(kn_blocks))
        + "\nನಿಮ್ಮ ಖಾತೆಯ 'History' (ಇತಿಹಾಸ) ವಿಭಾಗದಿಂದ ನೀವು ಇನ್ವಾಯ್ಸ್ ಅನ್ನು ವೀಕ್ಷಿಸಿ ಮತ್ತು ಡೌನ್‌ಲೋಡ್ ಮಾಡಬಹುದು.\n\n"
        "ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳು ಅಥವಾ ಸಹಾಯ ಬೇಕಾದರೆ, ದಯವಿಟ್ಟು ನಮ್ಮ 'Contact Us' ವಿಭಾಗದ ಮೂಲಕ ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ.\n\n"
        "ಧನ್ಯವಾದಗಳು,\nAgriAI ತಂಡ\n"
    )

    return en_body, hi_body, kn_body


if __name__ == '__main__':
    items = [{'crop_name':'Wheat','variety':'Local','order_quantity':10,'price_per_kg':20}]
    total_price = 200.00
    en, hi, kn = build_bodies(items, total_price, buyer_name='Ramesh')
    print('----- ENGLISH EMAIL -----\n')
    print(en)
    print('\n----- HINDI EMAIL -----\n')
    print(hi)
    print('\n----- KANNADA EMAIL -----\n')
    print(kn)
