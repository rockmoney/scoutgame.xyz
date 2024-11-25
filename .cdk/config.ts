import { Options } from './ProductionStack';

const charmverseCert = 'arn:aws:acm:us-east-1:310849459438:certificate/b960ff5c-ed3e-4e65-b2c4-ecc64e696902';
const scoutgameCert = 'arn:aws:acm:us-east-1:310849459438:certificate/b901f27e-5a33-4dea-b4fb-39308a580423';
const sunnyCert = 'arn:aws:acm:us-east-1:310849459438:certificate/4618b240-08da-4d91-98c1-ac12362be229';

export const apps: { [key: string]: { stg?: Options; prd?: Options } } = {
  scoutgameadmin: {
    prd: {
      sslCert: scoutgameCert
    }
  },
  scoutgame: {
    prd: {
      sslCert: scoutgameCert
    }
  },
  scoutgamecron: {
    prd: {
      environmentTier: 'Worker'
    },
    stg: {
      environmentTier: 'Worker'
    }
  },
  scoutgametelegram: {
    prd: {
      sslCert: scoutgameCert
    }
  }
};
