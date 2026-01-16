import { internal } from "./_generated/api";
import { query } from "./_generated/server";


// get user balance
export const getUserBalances = query({
    handler:async(ctx)=>{
        const user =await ctx.runQuery(internal.users.getCurrentUser);
        // -----------------1 to 1 expenses(no groupid)
        // filter expenses to only include one on one expense 
        // where the current user is either the payer or in the splits

        const expenses =(await ctx.db.query('expenses').collect()).filter(
            (e)=>
                !e.groupId &&
            (e.paidByUserId === user._id || 
                e.splits.some((s)=>s.userId === user._id))
        );

        let youOwe =0;
        let youAreOwned =0;
        const balanceByUser ={};

        for(const e of expenses){
            const isPayer =e.paidByUserId ===user._id;
            const mySplit =e.splits.find((s)=>s.userId === user._id);
            if(isPayer){
                for(const s of e.splits){
                    //skip users own split or already paid splits
                    if(s.userId === user._id ||s.paid) continue;

                    youAreOwned+=s.amount;

                    (balanceByUser[s.userId]??={owed :0,owing:0}).owed+=s.amount;
                }
            }
            else if(mySplit && !mySplit.paid){
                 youOwe+=mySplit.amount;

                 (balanceByUser[e.paidByUserId]??={owed :0,owing:0}).owing+=mySplit.amount;
            }
        }

//1-1 settlement (no group)
//get settlement that directly involve the current user
        const settlements =(await ctx.db.query("settlements").collect()).filter(
            (s)=>
                !s.groupId &&
            (s.paidByUserId ===user._id || s.receivedByUserId === user._id)
        );


        for(const s of settlements){
            if(s.paidByUserId ===user._id){
                youOwe-=s.amount;
                (balanceByUser[s.receivedByUserId]??={owed:0,owing:0}).owing-=s.amount;
            }
            else{
                youAreOwned-=s.amount;
                (balanceByUser[s.paidByUserId]??={owed:0,owing:0}).owed-=s.amount;
            }
        }


        const youOweList =[];
        const youAreOwnedList =[];

        for(const [uid,{owed ,owing}] of Object.entries(balanceByUser)){
            const net = owed -owing;
            if(net === 0){
                continue;
            }
            const counterpart = await ctx.db.get(uid);
            const base ={
                userId : uid,
                name : counterpart?.name??"unknown",
                imageUrl : counterpart?.imageUrl,
                amount :Math.abs(net),
            };
            net>0 ? youAreOwnedList.push(base) : youOweList.push(base);
        }

        youOweList.sort((a,b)=>b.amount -a.amount);
        youAreOwnedList.sort((a,b)=>b.amount-a.amount);

        return {
            youOwe,
            youAreOwned,
            totalBalance :youAreOwned -youOwe,
            oweDetails :{youOwe:youOweList , youAreOwned : youAreOwnedList},
        };
    },
});


export const getTotalSpent =query({
    handler: async (ctx) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear,0,1).getTime();

    const expenses = await ctx.db
    .query('expenses')
    .withIndex('by_date',(q)=>q.gte('date',startOfYear));


    const userExpenses = expenses.filter(
        (expense)=>
            expense.paidByUserId === user._id ||
        expense.splits.some((split)=>split.userId === user._id)
    );

    let totalSpent =0;
     userExpenses.forEach(expense=>{
        const userSplit = expense.splits.find(
            (split)=>split.userId === user._id
        );
        if(userSplit){
            totalSpent+=userSplit.amount;
        }
     });
     return totalSpent;
  },
});

export const getMonthlySpending =query({
handler: async (ctx) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);

    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear,0,1).getTime();

    const allExpenses =await ctx.db
    .query("expenses")
    .withIndex('by_date',(q)=>q.gte("date",startOfYear))
    .collect();
    
    
    },
});
