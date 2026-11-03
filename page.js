export default async function Home({ searchParams }) {
  const { success, canceled } = await searchParams;

  return (
    <main>
      <h1>Hello, World!</h1>
      {success && <p>Payment successful! Thanks for buying the iPhone Duo.</p>}
      {canceled && <p>Checkout canceled.</p>}
      <form action="/api/checkout" method="POST">
        <button type="submit">Buy iPhone Duo</button>
      </form>
    </main>
  );
}
