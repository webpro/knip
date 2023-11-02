function MyDeco() {
  return function (...args: any[]) {};
}

@MyDeco()
export class MyDecorated {}
