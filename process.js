define([
    'knockout',
    '_'

], function(ko) {

    return process3;

    function process3(userActivity, filter) {

        var ret = [];

        for (var userId in userActivity) {
            var drawUser = true;
            var user = userActivity[userId];

            /* Check for all minimum keys set in filter */
            drawUser = drawUser && isUserFulfillingMinimumRequirements(user, filter.min);

            /* Check, for minimum active months */
            drawUser = drawUser && (user.sums.activeMonthCount > filter.minActiveMonthCount);
            if (drawUser) {
                ret.push(user);
            }
        }

        console.log(ret, filter)
        ret = _.sortBy(ret, filter.orderBy);

        return ret;
    }


    function process2(userActivity, filter) {

        var ret = {
            firstMonthKey: undefined,
            lastMonthKey: undefined,
            filteredUsers: {}
        };

        for (var userId in userActivity) {
            var drawUser = true;
            var user = userActivity[userId];

            /* Check for all minimum keys set in filter */
            drawUser = drawUser && isUserFulfillingMinimumRequirements(user, filter.min);

            /* Check, for minimum active months */
            drawUser = drawUser && (user.sums.activeMonthCount > filter.minActiveMonthCount);
            if (drawUser) {
                ret.filteredUsers[userId] = user;

                /* Search for the last month to render */
                if (!ret.firstMonthKey) {
                    ret.firstMonthKey = user.firstMonthKey;
                    ret.lastMonthKey = user.lastMonthKey;
                }
                if (user.lastMonthKey > ret.lastMonthKey) ret.lastMonthKey = user.lastMonthKey;
                if (user.firstMonthKey < ret.firstMonthKey) ret.firstMonthKey = user.firstMonthKey;
            }
        }
        return ret;
    }




    /**
     * Everything put into the filter.min will be checked
     * if reaching the minimum required value.
     * If not, return false.
     */

    function isUserFulfillingMinimumRequirements(user, minimums) {
        for (var k in minimums) {
            if (user.sums[k] < minimums[k]) return false;
        }
        return true;
    }

    // function filterMonthsWithNotEnoughMessageCount(user, minMonthCount) {
    //     for (var yyyymm in user.monthData) {
    //         if (user.monthData[yyyymm].sum.count < minMonthCount) {
    //             delete user.monthData[yyyymm];
    //         }
    //     }
    // }

    // function filterMonthsWithNotEnoughMessageLength(user) {
    //     for (var yyyymm in user.monthData) {
    //         if (user.monthData[yyyymm].sum.length < minMonthCount) {
    //             delete user.monthData[yyyymm];
    //         }
    //     }
    // }


    function process1(userActivity, filter) {
        var startKey = Object.keys(userActivity[Object.keys(userActivity)[0]])[0];
        var ret = {
            regulars: [],
            trespassers: [],
            usermap: {},
            firstMonthKey: startKey,
            lastMonthKey: startKey
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
                    firstMonthKey: Object.keys(userActivity[user])[0]
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
                firstMonthKey: Object.keys(userActivity[user])[0],
                lastMonthKey: Object.keys(userActivity[user])[Object.keys(userActivity[user]).length - 1]
            }
            users.push(userToInsert);
            if (userToInsert.firstMonthKey < ret.firstMonthKey) ret.firstMonthKey = userToInsert.firstMonthKey;
            if (userToInsert.lastMonthKey > ret.lastMonthKey) ret.lastMonthKey = userToInsert.lastMonthKey;
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