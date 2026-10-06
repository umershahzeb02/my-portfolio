/* Picks the page for a route's data. The server renders it into the HTML and
   the browser hydrates the same tree from the same data, inlined in the page. */
import App from "./App";
import { BlogIndex, NotFound, Post } from "./Blog";

export default function Page({ data }) {
  switch (data.page) {
    case "home":
      return <App posts={data.posts} />;
    case "blog":
      return <BlogIndex posts={data.posts} />;
    case "post":
      return <Post post={data.post} n={data.n} newer={data.newer} older={data.older} />;
    default:
      return <NotFound />;
  }
}
