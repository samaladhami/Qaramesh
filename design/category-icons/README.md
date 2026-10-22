# Category icon review

Use lightweight SVG line icons matching the user's category reference. Deep teal outlines on the normal cards; white outlines when selected. Keep consistent rounded strokes and no text within the icons.

The user initially requested individual approval, then authorized creating all icons and adding them to the UI together, with later adjustments on request. The full set is now integrated in components/CategoryIcon.jsx; components/Menu.jsx uses it for category navigation. Dish photos remain unchanged.

## Review status

- الأطباق: individually approved; serving dome.
- السندويتشات: wrap.
- البركَر: burger.
- الكومبير: stuffed baked potato.
- البيتزا: pizza slice.
- الكنتاكي: chicken drumstick.
- الإيطالي: pasta bowl.
- الزنجر: chicken strips.
- الريزو: rice bowl.
- السلطات: salad bowl.
- المقبلات: fries.
- المشروبات الساخنة: steaming cup.
- المشروبات الباردة: iced drink.
- العصائر الطبيعية: juice and citrus.
- موهيتو: citrus and mint drink.
- الميلك شيك: whipped shake.
- أطباق اخرى: plate and cutlery.
- الكنافة: layered pastry.
- كريب وافل: waffle.
- الأراكيل: hookah.
- الكل: four-tile grid.

The user subsequently supplied replacement artwork for dishes, sandwiches, burgers, pizza, salads and fried chicken. These paths live in components/category-icon-art.json. Fried chicken was normalized to a tighter viewBox with rounded outlines. Zinger now shows strips and fries on a plate; mojito and kunafa were simplified and redesigned. The all-categories card retains its original gold star. Card padding is zero; the experimental taller cards were reverted.

PNG previews and drafts are historical review artifacts and may differ from the final UI. The authoritative icons are components/CategoryIcon.jsx and components/category-icon-art.json. Icons inherit currentColor to follow the selected state without image downloads.
