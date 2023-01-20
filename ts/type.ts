type Dictionary<K extends string | number | symbol = string, V = string> = { [key in K]?: V }
type TupleOf<T, N extends number, R extends readonly unknown[]> = R['length'] extends N ? R : TupleOf<T, N, readonly [T, ...R]>
type Tuple<T, N extends number> = N extends N ? number extends N ? T[] : TupleOf<T, N, []> & { length: N } : never
type Enumerate<N extends number, Acc extends readonly number[] = []> = Acc['length'] extends N ? Acc[number] : Enumerate<N, [...Acc, Acc['length']]>
type NumberRange<Lower extends number, Upper extends number> = Exclude<Enumerate<Upper>, Enumerate<Lower>>

export { Tuple, NumberRange, Dictionary }