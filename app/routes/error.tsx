export let loader = () => {
  throw new Error("Ah poop!");
};

export default function ErrorRoute() {
  return null;
}

export function ErrorBoundary() {
  return (
    <div>
      <h1>Oops!</h1>
      <p>Something went wrong.</p>
    </div>
  );
}
