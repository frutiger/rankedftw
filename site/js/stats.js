import {settings} from "./settings";

export let  TOT = -2;
export let  COUNT = 0;
export let  WINS = 1;
export let  LOSSES = 2;


//
// Singleton for handling fetching of stats data.
//
class StatsData {
    
    constructor() {
        this.deferred = {};
        this.raw_by_mode = {};
    }
    
    // Return deferred for when mode data is available.
    deferred_fetch_mode(mode_id) {
        if (typeof this.deferred[mode_id] === "undefined") {
            this.deferred[mode_id] = $.ajax({
                dataType: "json",
                url: settings.dynamic_url + 'stats/raw/' + mode_id + '/',
                success: (data) => { this.raw_by_mode[mode_id] = data; }
            });
        }
        return this.deferred[mode_id];
    }

    get_raws(mode_id) {
        return this.raw_by_mode[mode_id];
    }
}
export let stats_data = new StatsData();

//
// Wrapper object for a filtered and aggregated object.
//
export let Aggregate = function(mode_id, filters, group_by, raw) {
    var object = $.extend({}, filters);

    function create_accessor(type) {
        return function() {
            var data = raw.data;
            for (var i = 0; i < arguments.length; ++i) {
                data = data[arguments[i]];
            }
            if (group_by.length !== arguments.length) {
                data = data[TOT];
            }
            return data[type];
        };
    }

    // Get the count at the id sub path of group_by enums.
    object.count = create_accessor(COUNT);

    // Get the wins at the id sub path of group_by enums.
    object.wins = create_accessor(WINS);

    // Get the losses at the id sub path of group_by enums.
    object.losses = create_accessor(LOSSES);

    return object;
};

//
// Wrapper object for single raw stat to help with filtering and aggregation.
//
export let Stat = function(mode_id, raw) {

    function copy_non_data(raw_) {
        var o = {};
        Object.keys(raw_).forEach(function (key) {
            if (key !== 'data') {
                o[key] = raw_[key];
            }
        });
        return o;
    }

    var object = copy_non_data(raw);
    var stat = settings.enums_info.stat[raw.stat_version];

    function get(v, r, l, a) {
        // Get data at index.

        var index = stat.data_size
            * (  stat.version_indices[v] * stat.region_count * stat.league_count * stat.race_count
               + stat.region_indices[r] * stat.league_count * stat.race_count
               + stat.league_indices[l] * stat.race_count
               + stat.race_indices[a]);
        return raw.data.slice(index, index + stat.data_size);
    }

    function filter_sum(filters) {
        // Calculate a sum based on filters, one filter per type (version, region, league, races),
        // each filter maps to a list of type ids. An undefined type list will be regarded as a list with all ids.
        var sum = [0, 0, 0, 0];

        _.each(filters.versions, function(v) {
            _.each(filters.regions, function(r) {
                _.each(filters.leagues, function(l) {
                    _.each(filters.races, function(a) {
                        var data = get(v, r, l, a);
                        for (var i = 0; i < stat.data_size; ++i) {
                            sum[i] += data[i];
                        }
                    });
                });
            });
        });

        return sum;
    }

    function filter_aggregate(filters, group_by) {
        // Calculate a generic filtered map [of maps ..]  of sums. The
        // aggregate will only consist of data points that is in the filter
        // for each dimension (making it possible to aggregate EU + AM but not
        // include SEA). Filters is a map with index lists into the type
        // arrays. The group_by list is the type names of lists that should be
        // included (with sum) in the result. The order of group_by is
        // important. For example group_by = ['regions', 'races'] will return a
        // map of region_ids => map of race_ids => sums. The race_ids map will also
        // include a TOT which is the total in that region. The region_ids map
        // will also include a TOT which is a total of everything.

        if (group_by.length === 0) {
            return filter_sum(filters);
        }

        var result = {};
        var group_by__head = group_by[0];
        var group_by__head_s = group_by__head + 's';
        var group_by__rest = group_by.slice(1, group_by.length);
        var tot = [0, 0, 0, 0];

        for (var fi in filters[group_by__head_s]) {
            var next_filter = $.extend({}, filters);
            next_filter[group_by__head_s] = [filters[group_by__head_s][fi]];
            var next_res = filter_aggregate(next_filter, group_by__rest);
            result[filters[group_by__head_s][fi]] = next_res;
            var sum;
            if (next_res[TOT]) {
                sum = next_res[TOT];
            }
            else {
                sum = next_res;
            }
            for (var i = 0; i < stat.data_size; ++i) {
                tot[i] += sum[i];
            }
        }
        result[TOT] = tot;

        return result;
    }

    object.filter_aggregate = function(filters, group_by) {
        filters.versions = filters.versions || stat.version_ids;
        filters.regions = filters.regions   || stat.region_ids;
        filters.leagues = filters.leagues   || stat.league_ids;
        filters.races = filters.races       || stat.race_ids;

        var aggregated = copy_non_data(raw);
        aggregated.data = filter_aggregate(filters, group_by);
        return Aggregate(mode_id, filters, group_by, aggregated);
    };

    return object;
};


//
// Create a stats object for all stats for a mode.
//
export let Mode = function(mode_id) {
    var object = {};

    var raws = stats_data.get_raws(mode_id);

    // Get stat by ranking id, return another one close to it if not present.
    object.get = function(ranking_id) {
        var raw;
        for (var i = 0; i < raws.length; ++i) {
            raw = raws[i];  // Will cause a missing raws to get another raw.
            if (raw.id === ranking_id) {
                break;
            }
        }
        return Stat(mode_id, raw);
    };

    // Get lst stat.
    object.get_last = function() {
        return Stat(mode_id, raws[raws.length - 1])
    };

    // Iterate over raws in order. Skip raws that are of season version lower than min.
    object.each = function(fun, min_version) {
        for (var i = 0; i < raws.length; ++i) {
            if (_.isUndefined(min_version) || min_version <= raws[i].season_version) {
                fun(Stat(mode_id, raws[i]), i);
            }
        }
    };

    // Iterate over raws in reverse order. Skip raws that are of season version lower than min.
    object.each_reverse = function(fun, min_version) {
        for (var i = raws.length - 1; i >= 0; --i) {
            if (_.isUndefined(min_version) || min_version <= raws[i].season_version) {
                fun(Stat(mode_id, raws[i]), i);
            }
        }
    };

    return object;
};

