import { MyClass, MyEnum } from './members';

const instance = new MyClass();

class Parent {
  instance: MyClass;
  constructor() {
    this.instance = new MyClass();

    // This member reference is only found because `this.instance` is a typed member of Parent
    this.instance.bUsedExternalFromTypedMemberInstance();
  }
}

const parent = new Parent();

instance.bUsedExternal;
instance.cUsedExternal;
instance.dUsedExternal();
MyClass.eUsedExternal;
parent;

const a: MyEnum.A_UsedExternal = 1;
