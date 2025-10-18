## Reddit API Information

### Collecting Comments

To collect comments for a specific post (article), the `/comments/article` endpoint should be used. This endpoint is part of the "listings" section and supports pagination.

**Endpoint:** `/comments/article`

**Parameters for Pagination:**
*   `after` / `before`: Used to indicate the `fullname` of an item to use as the anchor point for the slice. Only one should be specified.
*   `limit`: Maximum number of items to return in a slice (e.g., comments).
*   `count`: The number of items already seen in the listing.
*   `show`: Optional parameter; if `all` is passed, filters such as "hide links that I have voted on" will be disabled.

**Fullname:** A combination of a thing's type and its unique ID. For comments, the type prefix is `t1_` (e.g., `t1_15bfi0`).

**Response Body Encoding:** For legacy reasons, JSON response bodies replace `<`, `>`, and `&` with `&lt;`, `&gt;`, and `&amp;`. To opt out of this behavior, add `raw_json=1` parameter to the request.

### Authentication

**OAuth:** Modhashes are not required when authenticated with OAuth. This is the preferred method for authentication, especially for browser extensions making requests on behalf of a user.

**Securing API Keys in Chrome Extensions:** Based on search results, it's generally not secure to store secret keys directly in an extension. If user authentication is required, it's better to use the user's login to authenticate requests or allow the user to enter their own API key (e.g., for OpenAI).

### Rate Limits

The documentation mentions "API access rules" and "Updated rate limits going into effect over the coming weeks" (from search snippets). It's crucial to respect these limits to avoid being blocked. Specific details on the exact rate limits were not immediately available in the main API documentation page, but search results indicate that the free version might be limited to around 1000 records.

Further investigation into the specific rate limit policies for browser extensions and user-authenticated requests will be necessary.
