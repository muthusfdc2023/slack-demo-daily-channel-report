/*
note - to use module in es6 - we need to change type in package.json to  type :"module"

in real time we get data from api or database - json format - javascript object notation
now insted of that we creating data to fetch posts
*/
const posts = [
    {
        id:1, title:'first post', body:'this is first post'},

    
    {id:2, title:'second post', body:'this is second post'},

    
    {id:3, title:'third post', body:'this is third post'},      
];

export const getposts = () =>{
    posts.forEach((post)=>{
        console.log(`id:${post.id} title:${post.title} body:${post.body}`);
        
    }); 
}

export const createpost = (post) =>{
    posts.push(post);
}   

export const getposts1 = ()=> posts; // default export - only one default export per module

export default getposts1; // default export - only one default export per module

export const getpostlength = () => posts.length;