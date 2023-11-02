export * as ReExported from './re-exported-module';
import * as NS from './namespace';
import * as NS2 from './namespace2';

NS.identifier;
NS['identifier2'];
NS.identifier3();

const { identifier, identifier2, identifier3 } = NS2;
