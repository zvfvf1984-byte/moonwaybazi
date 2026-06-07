Замедлить и ослабить анимацию перелива на кнопке «Генератор аффирмаций» на главной странице, сделав её едва заметной.

Технические детали:
1.  **`src/styles.css`**:
    *   Увеличить `animation-duration` utility `animate-shimmer` с `3s` до `8s`.
    *   Уменьшить интенсивность золотого цвета в градиенте `animate-shimmer` с `30%` до `12%`.
    *   Увеличить `animation-duration` utility `animate-shimmer-text` с `3.5s` до `10s`.
    *   Замедлить `animate-sparkle-spin` с `4s` до `6s`.
    *   Замедлить `animate-sparkle-twinkle` с `1.6s` до `3s`.
2.  **`src/routes/index.tsx`**:
    *   Уменьшить прозрачность слоя перелива (`animate-shimmer`) с `opacity-60` до `opacity-30`.
    *   Ослабить пульсирующее свечение вокруг кнопки: снизить `bg-gold/20` до `bg-gold/10` и `opacity-50` до `opacity-30`.