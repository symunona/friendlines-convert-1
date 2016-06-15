define([
    'ko'

], function(ko) {

    return process2;

    function process2() {

    }

    function process1(userActivity, filter) {
        var startKey = Object.keys(userActivity[Object.keys(userActivity)[0]])[0];
        var ret = {
            regulars: [],
            trespassers: [],
            usermap: {},
            startMonth: startKey,
            endMonth: startKey
        }

        var users = [];
        var userid = '';
        var colorIndex = 0;
        for (var user in userActivity) {
            var sumkeys = ['sum', 'inbound', 'outbound']
            var sums = {}
            sumkeys.map(function(s) {
                sums[s] = {
                    cnt: 0,
                    leng: 0,
                    startMonth: Object.keys(userActivity[user])[0]
                }
            })

            Object.keys(window.c.emotions).map(function(emotion) {
                sumkeys.map(function(s) {
                    sums[s][emotion] = 0
                })
            })

            Object.keys(userActivity[user]).map(function(monthkey) {
                sumkeys.map(function(sumfield) {
                    if (userActivity[user][monthkey][sumfield].cnt)
                        sums[sumfield].cnt += userActivity[user][monthkey][sumfield].cnt;
                    if (userActivity[user][monthkey][sumfield].leng)
                        sums[sumfield].leng += userActivity[user][monthkey][sumfield].leng;
                    Object.keys(window.c.emotions).map(function(emotion) {
                        sums[sumfield][emotion] += (userActivity[user][monthkey][sumfield][emotion] || 0)
                    })
                })
                userid = userActivity[user][monthkey].userid;
            })
            var userToInsert = {
                name: user,
                userid: userid,
                monthData: userActivity[user],
                sums: sums,
                color: colors[colorIndex++],
                startMonth: Object.keys(userActivity[user])[0],
                endMonth: Object.keys(userActivity[user])[Object.keys(userActivity[user]).length - 1]
            }
            users.push(userToInsert);
            if (userToInsert.startMonth < ret.startMonth) ret.startMonth = userToInsert.startMonth;
            if (userToInsert.endMonth > ret.endMonth) ret.endMonth = userToInsert.endMonth;
        }


        // filter monthData by the filter.minMonth        
        users.map(function(u) {
            for (var yyyymm in u.monthData) {
                if (u.monthData[yyyymm].sum.cnt < filter.minMonth.cnt) {
                    delete u.monthData[yyyymm];
                }
            }
        })

        // filter out users with less then a number of interaction month
        users = users.filter(function(u) {
            return filter.minMonth.repeat <= Object.keys(u.monthData).length
        });

        // filter users by numbers
        users = users.filter(function(u) {
            if (filter.min) {
                for (var k in filter.min) {
                    if (u.sums[k] < filter.min[k]) return false;
                }
            }
            return true;
        });


        users.sort(function(a, b) {
            for (var i = 0; i < filter.orderBy.length; i++) {
                if (a.sums[filter.orderBy[i]] > b.sums[filter.orderBy[i]]) return filter.descendingOrderBy ? 1 : -1;
                if (a.sums[filter.orderBy[i]] < b.sums[filter.orderBy[i]]) return filter.descendingOrderBy ? -1 : 1;
            }
            return 0;
        });

        var actualLine = 0;
        var lineUsageMap = {};
        var i = 0;

        users.map(function(user) {
            ret.usermap[user.userid] = user;
        })


        while (users.length) {

            // add the actual line for it
            u.addLineUsageWithPuffer(lineUsageMap, users[0].monthData, 1, 1)
            users[0].y = actualLine;
            ret.regulars.push(users.shift());

            // search the other users, maybe they fit in        
            for (var j = 1; j < users.length; j++) {
                if (u.userFitsInLine(lineUsageMap, users[j].monthData)) {
                    u.addLineUsageWithPuffer(lineUsageMap, users[j].monthData, 1, 1);
                    users[j].y = actualLine;

                    // console.log(users[j][Object.keys(users[j])[0]].userid)
                    ret.regulars.push(users.splice(j, 1)[0]);
                    j--;
                }
            }
            lineUsageMap = {};
            actualLine++;
            i++;
        }
        // console.log('filtered users', ret.regulars);

        window.nametable = {}

        return ret;
    }

});