export interface ReferencedNeverInterface {
  hello: boolean;
}

export interface ReferencedInterfaceInternally {
  message: string;
  repeat?: number;
}

export function referencedInternallyFunction(value: unknown) {
  console.log(value);
}

export function usedFunction(options: ReferencedInterfaceInternally) {
  referencedInternallyFunction(options);
}

export function referencedNeverFunction() {
  console.log('Hello!');
}
