enum UnexportedEnun {
  Member = 1,
}

class UnexportedClass {
  prop;
  public publicProp;
  public publicMethod() {}
}

export enum MyEnum {
  A_UsedExternal = 1,
  B_Unused = 1,
  C_UsedInternal = 1,
  'D_Key' = 'D_Value',
}

export class MyClass {
  static displayName?: string | undefined;

  constructor() {
    this.bound = this.bound.bind(this);
  }

  private aUnusedPrivate = 1;
  private aUsedPrivate = 1;

  public bUnusedPublic = 1;
  public bUsedExternal = 1;
  public bUsedExternalFromTypedMemberInstance() {}
  public bInternal = 1;

  cUnusedProp = 1;
  cUsedExternal: MyEnum.C_UsedInternal = 1;

  bound = () => {
    return this.bInternal + this.aUsedPrivate;
  };

  dUnusedMember() {}
  dUsedExternal() {
    const value = this.usedGetter;
    this.usedSetter = value;
  }

  static eUnusedStatic = 1;
  static eUsedExternal = 1;

  public get usedGetter(): string {
    return 'usedGetter';
  }

  public set usedSetter(value: string) {
    console.log(value);
  }

  public get unusedGetter(): string {
    return 'unusedGetter';
  }

  public set unusedSetter(value: string) {
    console.log(value);
  }
}

MyClass.displayName = 'My Class';
