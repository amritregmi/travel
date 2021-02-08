/**
 * @DESC Testing Auth Controller 
 * @CMD_TO_RUN_SPECIFIC_TEST mocha -g 'AuthController' 
 */
//process.env.NODE_ENV = 'test'
const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config({ path: './config.env' })

const chai = require('chai')
  , chaiHttp = require('chai-http');
const expect = chai.expect;
const app = require('../app')

chai.use(chaiHttp);

chai.should()

describe('AuthController', ()=> {
    describe('GET request to /api/v1/users', () => {
        before(async function (done) {
            
            const DB = process.env.DB_LINK.replace(
                '<password>',
                process.env.DATABASE_PASSWORD
            )
            
            const connection = await mongoose
                .connect(DB, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true,
                    useCreateIndex:true
                })
            if (connection) {
                console.log('Database connection successful.')
            }
                // .then(conn => {
                //     console.log('Database connection successful.')
                // })
        })
        it('Should get all User Records', async (done) => {
            const res = await chai.request(app).get('/api/v1/users')
            console.log(res.body);
            expect(res).to.have.status(200);
        });
    })
})

/**
describe('AuthController', ()=> {
    describe('POST request to /api/v1/users/login', () => {
        it('should have status 200', () => {
            
        });
        it('should return a token', () => {
            
        });
        it('should have status of success', () => {
            
        });
    })
})

describe('AuthController', ()=> {
    describe('POST request to /api/v1/users/forgotPassword', () => {
        it('should pass TEST 1', () => {
            
        });
        it('should pass TEST 2', () => {
            
        });
        it('should pass TEST 3', () => {
            
        });
    })
})

describe('AuthController', ()=> {
    describe('POST request to /api/v1/users/resetPassword', () => {
        it('should pass TEST 1', () => {
            
        });
        it('should pass TEST 2', () => {
            
        });
        it('should pass TEST 3', () => {
            
        });
    })
})

describe('AuthController', ()=> {
    describe('POST request to /api/v1/users/updateMyPassword', () => {
        it('should pass TEST 1', () => {
            
        });
        it('should pass TEST 2', () => {
            
        });
        it('should pass TEST 3', () => {
            
        });
    })
})
 */