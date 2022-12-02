import Fastify, { RequestGenericInterface } from 'fastify'
import cors from '@fastify/cors'
import { PrismaClient } from '@prisma/client'
import { string, z } from 'zod'

interface IByIdParam {
    id: string;
  }

const prisma = new PrismaClient({
    log: ['query']
})

async function bootstrap() {
    const fastify = Fastify({
        logger: true,
    })

    await fastify.register(cors, {
        origin: true
    })

    fastify.post('/auth', async (request, reply) => {
        const createUserBody = z.object({
            email: z.string(),
            password: z.string()
        })
        const { email, password } = createUserBody.parse(request.body)

        const validateUser = await prisma.user.findMany({
            where: {
                email: email,
                password: password
            },
        })

        var joinAuth = validateUser[0].email + ',' + validateUser[0].password

        const validateToken = btoa(unescape(encodeURIComponent(joinAuth)))

        return reply.status(200).send({ validateToken })
    })

    fastify.post('/token', async (request, reply) => {
        const createTokenBody = z.object({
            token: z.string(),
        })

        const { token } = createTokenBody.parse(request.body)
        console.log("______________", request.body)
        const validateToken = decodeURIComponent(escape(atob(token)));
        const decode = validateToken.split(',')

        const validateUser = await prisma.user.findMany({
            where: {
                email: decode[0],
                password: decode[1]
            },
        })
        
        return reply.status(200).send(validateUser)
    })

    fastify.post('/user', async (request, reply) => {
        const createUserBody = z.object({
            name: z.string(),
            email: z.string(),
            password: z.string()
        })

        const { name, email, password } = createUserBody.parse(request.body)

        const emailRegister =  await prisma.user.findUnique({
            where: {
                email
            }
        })

        if(!emailRegister) {
           const newUser =  await prisma.user.create({
                data: {
                    name,
                    email,
                    password
                }
            })
            return reply.status(201).send(newUser)    
        }

        
    })

    fastify.get('/user', async () => {
        const count = await prisma.user.findMany()
        return { count }
    })

    fastify.get('/post', async () => {
        const posts = await prisma.post.findMany({
            orderBy:{
                createdAt: 'asc'
            },
            include: {
                comment: true
            }
        })
        return { posts }
    })

    fastify.post('/post', async (request, reply) => {
        const createPostBody = z.object({
            title: z.string(),
            content: z.string(),
            userId: z.string()
        })

        const { title, content, userId} = createPostBody.parse(request.body) 

        const post = await prisma.post.create({
            data: {
                title,
                content,
                userId
            }
        })

        return reply.status(201).send(post)
    })

    fastify.put<{ Params: IByIdParam } >('/post/:id',async (request, reply) => {
        const { id } = request.params

        const createPostBody = z.object({
            title: z.string(),
            content: z.string(),
        })

        const { title, content} = createPostBody.parse(request.body) 
        
        const post = await prisma.post.update({
            where: {
                id
            },
            data: {
                title,
                content
            }
        })

        return reply.status(201).send(post)
    })

    fastify.delete<{ Params: IByIdParam } >('/post/:id',async (request, reply) => {
        const { id } = request.params
        
        const post = await prisma.post.delete({
            where: {
                id
            },
        })

        return reply.status(201).send(post)
    })

    fastify.get<{ Params: IByIdParam } >('/post/:id',async (request, reply) => {
        const { id } = request.params
        
        const post = await prisma.post.findUnique({
            where: { 
                id: id
            },
            include: {
                comment: true
            },
        })

        return reply.status(201).send(post)
    })

    fastify.post('/comment', async (request, reply) => {
        const createPostBody = z.object({
            content: z.string(),
            userId: z.string(),
            postId: z.string()
        })

        const { content, userId, postId } = createPostBody.parse(request.body) 

        await prisma.comment.create({
            data: {
                content,
                userId,
                postId
            }
        })
    
        return reply.status(201).send("Comentario criado com sucesso")
    })

    fastify.put<{ Params: IByIdParam } >('/comment/:id',async (request, reply) => {
        const { id } = request.params

        const createPostBody = z.object({
            content: z.string(),
        })

        const { content} = createPostBody.parse(request.body) 
        
        const post = await prisma.comment.update({
            where: {
                id
            },
            data: {
                content
            }
        })

        return reply.status(201).send(post)
    })

    fastify.delete<{ Params: IByIdParam } >('/comment/:id',async (request, reply) => {
        const { id } = request.params
        
        const post = await prisma.comment.delete({
            where: {
                id
            },
        })

        return reply.status(201).send(post)
    })

    fastify.get<{ Params: IByIdParam } >('/comment/:id', async (request, reply) => {
        const { id } = request.params
        
        const comment = await prisma.comment.findUnique({
            where: { 
                id
            },
        })
        console.log("_________",comment)
        return reply.status(201).send(comment)
    })

    await fastify.listen({ port: 3333 })
}

bootstrap()