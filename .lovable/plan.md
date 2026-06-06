Сделать углы у всех «окошек» сайта более мягкими и закруглёнными — в стиле кнопки и чата бота.

**Что меняю:**

1. **`src/styles.css`** — увеличить базовый радиус с `0.25rem` → `0.75rem`. Это автоматически закруглит все shadcn-компоненты (`Card`, `Button`, `Input`, `Dialog`, `Badge`, `Tabs`, `Select` и т.д.), которые используют `rounded-md/lg/xl`.

2. **Глобальная замена `rounded-sm` → `rounded-xl`** в файлах проекта (кроме служебных `src/components/ui/*`, которые уже работают через токен `--radius`):
   - `src/components/ChatBotWidget.tsx` (само окно чата и сообщения)
   - `src/components/AdminChats.tsx`
   - `src/components/SiteHeader.tsx`, `SiteFooter.tsx`
   - страницы: `index.tsx`, `catalog.tsx`, `service.$slug.tsx`, `cart.tsx`, `contact.tsx`, `about.tsx`, `offer.tsx`, `privacy.tsx`, `auth.tsx`, `reset-password.tsx`, `_authenticated/admin.tsx`

   `rounded-full` (бот-кнопка, аватарки, точки-индикаторы) **не трогаю** — там круг и так уместен.

3. Проверить визуально, что чат-бот, карточки «Пять сфер», карточки услуг, шапка/футер, корзина и админка теперь имеют единый мягкий радиус.

Никакой другой логики, цветов, шрифтов и контента не меняю — только закругление углов.