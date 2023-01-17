type TupleOf<T, N extends number, R extends readonly unknown[]> = R['length'] extends N ? R : TupleOf<T, N, readonly [T, ...R]>
type Tuple<T, N extends number> = N extends N ? number extends N ? T[] : TupleOf<T, N, []> & { length: N } : never
type Enumerate<N extends number, Acc extends readonly number[] = []> = Acc['length'] extends N ? Acc[number] : Enumerate<N, [...Acc, Acc['length']]>
type NumberRange<From extends number, To extends number> = Exclude<Enumerate<To>, Enumerate<From>>

export { Tuple, NumberRange }