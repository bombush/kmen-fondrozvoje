## SpecStory

## Making Elements Screen Reader Accessible (2/25/2025, 7:53:28 PM)

_**User**_

how to make this visible only for screen reader?

---

_**Assistant**_

🤖 To make the `SheetTitle` visible only for screen readers, you can use the `sr-only` class from TailwindCSS. This class hides the element visually but keeps it accessible for screen readers. Here’s how you can modify the `SheetTitle`:

```typescript:src/components/layout/Navbar.tsx
              <SheetTitle className="sr-only">Navigation</SheetTitle>
```

### Explanation of the Update:
- Added the `className="sr-only"` to the `SheetTitle` component to ensure it is only visible to screen readers.

---



---

