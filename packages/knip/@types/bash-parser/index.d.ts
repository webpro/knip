declare module '@ericcornelissen/bash-parser' {
  type Name = {
    type: string;
    text: string;
  };

  type CompoundList = {
    type: 'CompoundList';
    commands: Command[];
  };

  type Command = {
    type: 'Command';
    name?: Name;
    suffix: Name[];
    prefix?: Prefix[];
  };

  type Prefix = {
    expansion?: Expansion[];
  };

  type LogicalExpression = {
    type: 'LogicalExpression';
    left: Command;
    right: Command;
  };

  type If = {
    type: 'If';
    clause: Node;
    then: Node;
    else?: Node;
  };

  type For = {
    type: 'For';
    name: Name;
    wordlist: Name[];
    do: CompoundList;
  };

  type Function_ = {
    type: 'Function';
    name: Name;
    body: CompoundList;
  };

  type Expansion = {
    type: 'CommandExpansion';
    commandAST: AST;
  };

  type Pipeline = {
    type: 'Pipeline';
    commands: Command[];
  };

  export type Node = CompoundList | Command | LogicalExpression | If | For | Function_ | Pipeline;

  export type AST = {
    type: 'Script';
    commands: Node[];
  };

  declare const parse: (s: string) => AST;

  export default parse;
}
