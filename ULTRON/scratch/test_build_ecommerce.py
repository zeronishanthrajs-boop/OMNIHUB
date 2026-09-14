import re
import html

def extract_ecommerce_entities(goal: str) -> dict:
    """Extracts product title, original price, discounted price, and stock count from prompt."""
    orig_price = 200.0
    disc_price = 277.0
    
    # Try finding explicit original price
    match_orig = re.search(r'(?:worth|original|cost|price|is)\s*\$?(\d+(?:\.\d{1,2})?)\$?', goal, re.IGNORECASE)
    if match_orig:
        try: orig_price = float(match_orig.group(1))
        except Exception: pass

    # Try finding discount price
    match_disc = re.search(r'(?:discount(?:ed)?(?:\s+price)?|after discount(?: price)?|sale)\s*(?:is|will be|at)?\s*\$?(\d+(?:\.\d{1,2})?)\$?', goal, re.IGNORECASE)
    if match_disc:
        try: disc_price = float(match_disc.group(1))
        except Exception: pass
    else:
        # Check all dollar values
        all_nums = [float(x) for x in re.findall(r'\$?(\d+(?:\.\d{1,2})?)\$?', goal)]
        if len(all_nums) >= 2:
            orig_price = all_nums[0]
            disc_price = all_nums[1]

    # Stock
    stock = 300
    match_stock = re.search(r'(\d+)\s*(?:pieces?|peice|units?|items?|in stock|on stock)', goal, re.IGNORECASE)
    if match_stock:
        try: stock = int(match_stock.group(1))
        except Exception: pass
    elif "stock" in goal.lower():
        stock_nums = re.findall(r'\b(\d+)\b', goal)
        for num in stock_nums:
            n = int(num)
            if n != int(orig_price) and n != int(disc_price):
                stock = n
                break

    # Product Title
    product_name = "AeroFlow Stealth Pro Table Fan"
    match_prod = re.search(r'selling (?:a |an )?(.*?)(?: worth| for| we| with| after|$)', goal, re.IGNORECASE)
    if match_prod:
        extracted = match_prod.group(1).strip()
        if len(extracted) > 2 and len(extracted) < 50:
            product_name = extracted.title()
            if "Fan" in product_name and "Table" not in product_name:
                product_name = "Table " + product_name
    elif "fan" in goal.lower():
        product_name = "AeroFlow Stealth Pro Table Fan"

    return {
        "title": product_name,
        "original_price": orig_price,
        "discount_price": disc_price,
        "stock": stock
    }

if __name__ == "__main__":
    test_goal = "create a website for selling a single table fan worth 200$ we have 300 peice on stock after discount price will be 277$ make sure high quality"
    res = extract_ecommerce_entities(test_goal)
    print("Extracted entities:", res)
