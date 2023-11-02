type Primitive = null | undefined | string | number | boolean | symbol | bigint;
export type LiteralUnion<LiteralType, BaseType extends Primitive> = LiteralType | (BaseType & Record<never, never>);

type CommonKeys<T extends object> = keyof T;
type AllKeys<T> = T extends unknown ? keyof T : never;
type Subtract<A, C> = A extends C ? never : A;
type NonCommonKeys<T extends object> = Subtract<AllKeys<T>, CommonKeys<T>>;
type PickType<T, K extends AllKeys<T>> = T extends { [k in K]?: unknown } ? T[K] : undefined;
type PickTypeOf<T, K extends string | number | symbol> = K extends AllKeys<T> ? PickType<T, K> : never;
export type MergeUnion<T extends object> = {
  [k in CommonKeys<T>]: PickTypeOf<T, k>;
} & {
  [k in NonCommonKeys<T>]?: PickTypeOf<T, k>;
};
