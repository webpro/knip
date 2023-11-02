import React from 'react';

const Component = React.lazy(() => import('./Component'));

function MainComponent() {
  return (
    <main>
      <Component />
    </main>
  );
}
