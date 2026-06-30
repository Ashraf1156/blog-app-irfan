# Getting Started with Next.js: The Modern React Framework

> Set up a modern React project utilizing Next.js app router, server components, and dynamic data fetching hooks.

**Author:** Marcus Tech  
**Category:** Web Dev  
**Updated At:** June 30, 2026

---

For years, React has been the go-to library for building dynamic user interfaces. However, configuring build systems, handling routing, and managing server-side rendering (SSR) manually was often complex. Enter **Next.js**.

Created by Vercel, Next.js is a full-stack React framework that provides a built-in router, server-side rendering, static site generation, and optimized image loading out of the box. Let's explore its core concepts and set up our first Next.js project.

---

## 1. Why Next.js?

Next.js solves several problems inherent to standard Single Page Applications (SPAs):

*   **SEO & Speed**: Traditional React apps render in the client browser, meaning search engine crawlers sometimes see a blank page. Next.js supports Server-Side Rendering (SSR) and Static Site Generation (SSG), pre-rendering HTML on the server.
*   **Zero-Config Routing**: File-system routing means you create directories, and Next.js automatically sets up paths.
*   **React Server Components (RSC)**: Fetch data directly in your React components on the server, resulting in smaller JavaScript bundles on the client side.

---

## 2. Directory Structure: The App Router

Next.js uses the **App Router** (introduced in version 13), which uses the `app/` directory. Here is a typical file structure:

```
app/
├── layout.js      # Global shell (navbars, footers, meta tags)
├── page.js        # Home page root route (/)
├── about/
│   └── page.js    # About page route (/about)
└── blog/
    ├── page.js    # Blog list route (/blog)
    └── [slug]/
        └── page.js# Dynamic blog post route (/blog/some-post-slug)
```

Each subdirectory corresponds to a URL path segment. The `page.js` file is what renders for that specific route.

---

## 3. Server vs. Client Components

By default, all components in the `app/` directory are **React Server Components (RSC)**. They are rendered on the server and do not ship React hooks (`useState`, `useEffect`) or event listeners to the browser.

### Creating a Server Component (Default)

You can fetch data directly inside the component using standard async/await:

```javascript
// app/users/page.js
async function getUsers() {
  const res = await fetch('https://api.github.com/users');
  return res.json();
}

export default async function UsersPage() {
  const users = await getUsers();
  
  return (
    <main>
      <h1>GitHub Users</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.login}</li>
        ))}
      </ul>
    </main>
  );
}
```

### Creating a Client Component

If you need user interactivity, browser API hooks, or state, add the `"use client"` directive at the very top of the file:

```javascript
"use client";

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Clicked {count} times
    </button>
  );
}
```

---

## 4. Advanced Data Fetching & Caching

Next.js extends the native Web `fetch` API to support deep caching configurations on the server:

1.  **Static Data (SSG)**: Stays cached indefinitely until you build again.
    ```javascript
    fetch('https://api.example.com/data', { cache: 'force-cache' })
    ```
2.  **Dynamic Data (SSR)**: Fetched on every request.
    ```javascript
    fetch('https://api.example.com/data', { cache: 'no-store' })
    ```
3.  **Incremental Static Regeneration (ISR)**: Caches the data but updates it in the background at most every X seconds.
    ```javascript
    fetch('https://api.example.com/data', { next: { revalidate: 60 } })
    ```

---

## Conclusion

Next.js is a powerful framework that lets you build production-ready, performant apps with React. By utilizing the App Router and Server Components, you get the best of both worlds: developer-friendly components and blazing-fast load times. Have fun exploring!
