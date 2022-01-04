package com.carolinarollergirls.scoreboard.core.interfaces;
/**
 * Copyright (C) 2008-2012 Mr Temper <MrTemper@CarolinaRollergirls.com>
 *
 * This file is part of the Carolina Rollergirls (CRG) ScoreBoard.
 * The CRG ScoreBoard is licensed under either the GNU General Public
 * License version 3 (or later), or the Apache License 2.0, at your option.
 * See the file COPYING for details.
 */

import java.util.ArrayList;
import java.util.Collection;

import com.carolinarollergirls.scoreboard.event.Child;
import com.carolinarollergirls.scoreboard.event.Property;
import com.carolinarollergirls.scoreboard.event.ScoreBoardEventProvider;
import com.carolinarollergirls.scoreboard.event.Value;

// Managemnt of currently playing teams.
public interface CurrentTeam extends ScoreBoardEventProvider, TimeoutOwner {
    public void load(Team t);

    public CurrentPosition getPosition(FloorPosition fp);

    public static Collection<Property<?>> props = new ArrayList<>();

    public static final Value<Team> TEAM = new Value<>(Team.class, "Team", null, props);

    public static final Child<CurrentSkater> SKATER = new Child<>(CurrentSkater.class, "Skater", props);
    public static final Child<CurrentPosition> POSITION = new Child<>(CurrentPosition.class, "Position", props);
}
