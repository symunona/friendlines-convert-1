define([
    'knockout',
    '_'

], function(ko) {

    return process;

    function process(userActivity, filter) {

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

        ret = _.sortBy(ret, filter.orderBy);

        if (filter.descendingOrderBy) {
            ret = ret.reverse();
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


});