import { Link } from '@remix-run/react';
import { useOptionalUser } from '~/utils';

export default function Index() {
  const user = useOptionalUser();
  return (
    <main>
      <Link to="/">link</Link>
    </main>
  );
}
