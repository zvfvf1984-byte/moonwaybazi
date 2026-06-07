Стилизовать скроллбар в тёмной гамме сайта, чтобы белая полоса справа не выделялась.

В `src/styles.css` добавить кастомные стили скроллбара:
- WebKit (`::-webkit-scrollbar`, `-track`, `-thumb`, `-thumb:hover`): ширина 10px, прозрачный фон трека, thumb тёмно-золотой полупрозрачный (`color-mix(in oklab, var(--gold) 25%, transparent)`), при hover чуть ярче.
- Firefox: `html { scrollbar-color: ... var(--background); scrollbar-width: thin; }`.