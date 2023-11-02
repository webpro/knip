namespace MyNamespace {
  export type Bar = number;
  export const bar = 2;
}

type FooBar = MyNamespace.Bar;
const foobar = MyNamespace.bar;
