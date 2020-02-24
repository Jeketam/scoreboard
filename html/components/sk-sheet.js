function prepareSkSheetTable(element, teamId, mode) {

	'use strict';
	$(initialize);

	var teamName = "";

	// Looking these up via the DOM is slow, so cache them.
	var periodElements = {};
	var jamElements = {};

	function initialize() {
		if (mode != 'operator') {
			WS.Register(['ScoreBoard.Team(' + teamId + ').Name'], function () { teamNameUpdate(); });
			WS.Register(['ScoreBoard.Team(' + teamId + ').AlternateName(operator)'], function () { teamNameUpdate(); });

			WS.Register(['ScoreBoard.Team(' + teamId + ').Color'], function (k, v) {
				element.find('#head').css('background-color', WS.state['ScoreBoard.Team(' + teamId + ').Color(operator_bg)']);
				element.find('#head').css('color', WS.state['ScoreBoard.Team(' + teamId + ').Color(operator_fg)']);
			});
		}

		WS.Register(['ScoreBoard.Period(*).Number',
				'ScoreBoard.Period(*).Jam(*).Number',
				'ScoreBoard.Period(*).Jam(*).StarPass',
				'ScoreBoard.Period(*).Jam(*).TeamJam(' + teamId + ').AfterSPScore',
				'ScoreBoard.Period(*).Jam(*).TeamJam(' + teamId + ').Calloff',
				'ScoreBoard.Period(*).Jam(*).TeamJam(' + teamId + ').JamScore',
				'ScoreBoard.Period(*).Jam(*).TeamJam(' + teamId + ').Injury',
				'ScoreBoard.Period(*).Jam(*).TeamJam(' + teamId + ').Lead',
				'ScoreBoard.Period(*).Jam(*).TeamJam(' + teamId + ').Lost',
				'ScoreBoard.Period(*).Jam(*).TeamJam(' + teamId + ').NoInitial',
				'ScoreBoard.Period(*).Jam(*).TeamJam(' + teamId + ').StarPass',
				'ScoreBoard.Period(*).Jam(*).TeamJam(' + teamId + ').TotalScore',
				'ScoreBoard.Period(*).Jam(*).TeamJam(' + teamId + ').Fielding(Jammer).SkaterNumber',
				'ScoreBoard.Period(*).Jam(*).TeamJam(' + teamId + ').Fielding(Pivot).SkaterNumber',
				'ScoreBoard.Period(*).Jam(*).TeamJam(' + teamId + ').ScoringTrip(*).AfterSP',
				'ScoreBoard.Period(*).Jam(*).TeamJam(' + teamId + ').ScoringTrip(*).Current',
				'ScoreBoard.Period(*).Jam(*).TeamJam(' + teamId + ').ScoringTrip(*).Score',
				'ScoreBoard.Period(*).Jam(*).TeamJam(' + teamId + ').ScoringTrip(*).Annotation'
		], handleUpdate);
	}

	function teamNameUpdate() {
		teamName = WS.state['ScoreBoard.Team(' + teamId + ').Name'];

		if (WS.state['ScoreBoard.Team(' + teamId + ').AlternateName(operator)'] != null) {
			teamName = WS.state['ScoreBoard.Team(' + teamId + ').AlternateName(operator)']
		}

		element.find('#head .Team').text(teamName);
	}

	function handleUpdate(k, v) {
		// Ensure periods/jams exist.
		if (!k.Period || k.Period == 0) return;
		if (v == null && k == 'ScoreBoard.Period('+k.Period+').Number') {
			element.children('table.Period[nr='+k.Period+']').remove();
			delete periodElements[k.Period];
			delete jamElements[k.Period];
		} else if (v != null){
			createPeriod(k.Period);
		}
		if (!k.Jam || k.Jam == 0) return;
		var prefix = 'ScoreBoard.Period('+k.Period+').Jam('+k.Jam+').';
		if (v == null && k == prefix + 'Number') {
			element.children('table.Period[nr='+k.Period+']').find('tr[nr='+k.Jam+']').remove();
			delete jamElements[k.Period][k.Jam];
		} else if (v != null) {
			createJam(k.Period, k.Jam);
		}

		var je = (jamElements[k.Period] || {})[k.Jam];
		if (je == null) return;
		var jamRow = je[0];
		var spRow = je[1];
		if (k == prefix + 'StarPass') {
			if (isTrue(v)) {
				if (mode == 'operator') {
					jamRow.before(spRow);
				} else {
					jamRow.after(spRow);
				}
			} else {
				spRow.detach();
			}
		}

		// Everything after here is team specific.
		if (k.TeamJam != teamId) return;
		prefix = prefix + 'TeamJam(' + teamId + ').';
		switch (k.substring(prefix.length)) {
			case 'Fielding(Jammer).SkaterNumber':
				jamRow.find('.Jammer').text(v);
				break;
			case 'Lost':
				jamRow.find('.Lost').text(isTrue(v)?'X':'');
				break;
			case 'Lead':
				jamRow.find('.Lead').text(isTrue(v)?'X':'');
				break;

			case 'JamScore': case 'AfterSPScore': case 'TotalScore':
				if (mode != 'copyToStatsbook') {
						jamRow.find('.JamTotal').text(WS.state[prefix+'JamScore'] - WS.state[prefix+'AfterSPScore']);
						spRow.find('.JamTotal').text(WS.state[prefix+'AfterSPScore']);
						jamRow.find('.GameTotal').text(WS.state[prefix+'TotalScore'] - WS.state[prefix+'AfterSPScore']);
						spRow.find('.GameTotal').text(WS.state[prefix+'TotalScore']);
				}
				break;

			case 'Calloff': case 'Injury': case 'StarPass':
			case 'Fielding(Pivot).SkaterNumber':
				var row = jamRow;
				var otherRow = spRow;
				if (isTrue(WS.state[prefix+'StarPass'])) {
					row = spRow;
					otherRow = jamRow;
				}
				row.find('.Calloff').text(isTrue(WS.state[prefix+'Calloff'])?'X':'');
				row.find('.Injury').text(isTrue(WS.state[prefix+'Injury'])?'X':'');
				otherRow.find('.Calloff').text('');
				otherRow.find('.Injury').text('');
				spRow.find('.JamNumber').text(isTrue(WS.state[prefix+'StarPass'])?'SP':'SP*');
				spRow.find('.Jammer').text(isTrue(WS.state[prefix+'StarPass']) ? WS.state[prefix+'Fielding(Pivot).SkaterNumber'] : '');
				break;

			case 'ScoringTrip(1).AfterSP': case 'ScoringTrip(1).Score': case 'ScoringTrip(1).Annotation':
			case 'ScoringTrip(2).AfterSP': case 'ScoringTrip(2).Score': case 'ScoringTrip(2).Annotation':
			case 'ScoringTrip(2).Current': case 'NoInitial':
				var trip1Score = WS.state[prefix+'ScoringTrip(1).Score'];
				var trip1AfterSP = isTrue(WS.state[prefix+'ScoringTrip(1).AfterSP']);
				var trip1HasAnnotation = WS.state[prefix+'ScoringTrip(1).Annotation'] != '';
				var trip2Score = WS.state[prefix+'ScoringTrip(2).Score'];
				var trip2Current = isTrue(WS.state[prefix+'ScoringTrip(2).Current']);
				var trip2AfterSP = isTrue(WS.state[prefix+'ScoringTrip(2).AfterSP']);
				var trip2HasAnnotation = trip2Score != null && WS.state[prefix+'ScoringTrip(2).Annotation'] != '';
				var noInitial = isTrue(WS.state[prefix+'NoInitial']);
				var scoreText = '';
				var otherScoreText = '';
				if (trip2Score == 0 && trip2Current) {
					trip2Score = '.';
				}
				if (trip1Score > 0) {
					if (trip2Score == null) {
						scoreText = trip1Score + ' + NI';
					} else if (trip1AfterSP == trip2AfterSP) {
						scoreText = trip1Score + ' + ' + trip2Score;
					} else {
						scoreText = trip2Score;
						otherScoreText = trip1Score + ' + SP';
					}
				} else if (trip2Score != null) {
					scoreText = trip2Score; 					
				}
				var row = jamRow;
				var otherRow = spRow;
				if (trip2AfterSP || (trip2Score == null && trip1AfterSP)) {
					row = spRow;
					otherRow = jamRow;
				}
				row.find('.Trip2').toggleClass('hasAnnotation', trip2HasAnnotation).text(scoreText);
				otherRow.find('.Trip2').removeClass('hasAnnotation').text(otherScoreText);
				jamRow.find('.NoInitial').toggleClass('hasAnnotation', trip1HasAnnotation && !trip1AfterSP)
					.text(trip1AfterSP || noInitial?'X':'');
				spRow.find('.NoInitial').toggleClass('hasAnnotation', trip1HasAnnotation && trip1AfterSP)
					.text(trip1AfterSP && noInitial?'X':'');
				break;
				
			 default:
				if (k.parts[4] == 'ScoringTrip' && k.ScoringTrip >= 3 && k.ScoringTrip < 10) {
					var t = k.ScoringTrip;
					var row = jamRow;
					var otherRow = spRow;
					if (isTrue(WS.state[prefix+'ScoringTrip('+t+').AfterSP'])) {
						row = spRow;
						otherRow = jamRow;
					}
					var score = WS.state[prefix+'ScoringTrip('+t+').Score'];
					var current = isTrue(WS.state[prefix+'ScoringTrip('+t+').Current']);
					var hasAnnotation = WS.state[prefix+'ScoringTrip('+t+').Annotation'] != '';
					row.find('.Trip'+t).toggleClass('hasAnnotation', hasAnnotation)
						.text(score == null ? '' : current && score == 0 ? '.' : score);
					otherRow.find('.Trip'+t).removeClass('hasAnnotation').text('');
				} else if (k.parts[4] == 'ScoringTrip' && k.ScoringTrip >= 10) {
					var scoreBeforeSP = '';
					var scoreAfterSP = '';
					var t = 10;
					var annotationBeforeSP = false;
					var annotationAfterSP = false;
					while (true) {
						var tripScore = WS.state[prefix+'ScoringTrip('+t+').Score'];
						if (tripScore == null) break;
						if (isTrue(WS.state[prefix+'ScoringTrip('+t+').AfterSP'])) {
							scoreAfterSP = scoreAfterSP==='' ? tripScore : scoreAfterSP + " + " + tripScore;
							annotationAfterSP = annotationAfterSP || WS.state[prefix+'ScoringTrip('+t+').Annotation'] != '';
						} else {
							scoreBeforeSP = scoreBeforeSP==='' ? tripScore : scoreBeforeSP + " + " + tripScore;
							annotationBeforeSP = annotationBeforeSP || WS.state[prefix+'ScoringTrip('+t+').Annotation'] != '';
						}
						t++;
					}
					jamRow.find('.Trip10').toggleClass('hasAnnotation', annotationBeforeSP).text(scoreBeforeSP);
					spRow.find('.Trip10').toggleClass('hasAnnotation', annotationAfterSP).text(scoreAfterSP);
				}

		}
	}

	function createPeriod(nr) {
		if (nr > 0 && periodElements[nr] == null) {
			createPeriod(nr-1);
			var table = $('<table cellpadding="0" cellspacing="0" border="1">')
				.addClass('SK Period').attr('nr', nr);
			if (mode == 'operator') {
				table.prependTo(element).addClass("Backwards");
			} else {
				table.appendTo(element).addClass("Forwards");
			}
			if (mode != 'operator') {
				var header = $('<thead><tr>').appendTo(table);
				$('<td>').addClass('JamNumber').text('JAM').appendTo(header);
				$('<td>').addClass('Jammer').text('JAMMER').appendTo(header);
				$('<td>').addClass('SmallHead').append($('<div>').text('LOST')).appendTo(header);
				$('<td>').addClass('SmallHead').append($('<div>').text('LEAD')).appendTo(header);
				$('<td>').addClass('SmallHead').append($('<div>').text('CALL')).appendTo(header);
				$('<td>').addClass('SmallHead').append($('<div>').text('INJ')).appendTo(header);
				$('<td>').addClass('SmallHead').append($('<div>').text('NI')).appendTo(header);
				$('<td>').html('<span class ="Team">' + teamName + '</span> P' + nr)
					.attr('colspan', 9).prop('id','head').appendTo(header);
				if (mode != 'copyToStatsbook') {
					$('<td>').addClass('JamTotal').text('JAM').appendTo(header);
					$('<td>').addClass('GameTotal').text('TOTAL').appendTo(header);
				}
			}
			var body = $('<tbody>').appendTo(table);
			periodElements[nr] = body;
			jamElements[nr] = {};
		}
	}


	function createJam(p, nr) {
		var table = periodElements[p];
		if (nr > 0 && jamElements[p][nr] == null) {
			createJam(p, nr-1);

			var prefix = 'ScoreBoard.Period('+p+').Jam('+nr+').TeamJam('+teamId+').';

			var jamRow = $('<tr>').addClass('Jam').attr('nr', nr);
			$('<td>').addClass('JamNumber Darker').text(nr).appendTo(jamRow);
			$('<td>').addClass('Jammer').appendTo(jamRow);
			$('<td>').addClass('Lost Narrow Darker').click(function() { WS.Set(prefix+'Lost', $(this).text() == ""); }).appendTo(jamRow);
			$('<td>').addClass('Lead Narrow Darker').click(function() { WS.Set(prefix+'Lead', $(this).text() == ""); }).appendTo(jamRow);
			$('<td>').addClass('Calloff Narrow Darker').click(function() { WS.Set(prefix+'Calloff', $(this).text() == ""); }).appendTo(jamRow);
			$('<td>').addClass('Injury Narrow Darker').click(function() { WS.Set(prefix+'Injury', $(this).text() == ""); }).appendTo(jamRow);
			$('<td>').addClass('NoInitial Narrow Darker').click(function() { setupTripEditor(p, nr, teamId, 1); }).appendTo(jamRow);
			$.each(new Array(9), function (idx) {
				var t = idx + 2;
				$('<td>').addClass('Trip Trip'+t).click(function() { setupTripEditor(p, nr, teamId, t); }).appendTo(jamRow);
			});
			if (mode != 'copyToStatsbook') {
				$('<td>').addClass('JamTotal').appendTo(jamRow);
				$('<td>').addClass('GameTotal').appendTo(jamRow);
			}

			var spRow = jamRow.clone(true).removeClass('Jam').addClass('SP');
			jamRow.children('.Jammer').click(function() { showSkaterSelector(prefix+'Fielding(Jammer).Skater', teamId); });
			spRow.children('.Jammer').click(function() { showSkaterSelector(prefix+'Fielding(Pivot).Skater', teamId); });
			if (mode == 'operator') {
				table.prepend(jamRow)
			} else {
				table.append(jamRow);
			}
			jamElements[p][nr] = [jamRow, spRow];

		}
	}

}

var tripEditor;

function setupTripEditor(p, j, teamId, t) {
	while (t > 1 && WS.state['ScoreBoard.Period('+p+').Jam('+j+').TeamJam('+teamId+').ScoringTrip('+(t-1)+').Score'] === undefined) { t--; }
	if (t < 1) { t = 1; }
	
	var prefix = 'ScoreBoard.Period('+p+').Jam('+j+').TeamJam('+teamId+').ScoringTrip('+t+').';

	tripEditor.dialog('option', 'title', 'Period ' + p + ' Jam ' + j + ' Trip ' + (t===1?'Initial':t));
	tripEditor.find('#score').val(WS.state[prefix+'Score']);
	tripEditor.find('#afterSP').toggleClass('checked', isTrue(WS.state[prefix+'AfterSP']));
	var annotation = WS.state[prefix+'Annotation'] || '';
	tripEditor.find('#annotation').val(annotation);
	tripEditor.find('#prev').toggleClass('Invisible', t === 1);
	tripEditor.find('#next').toggleClass('Invisible', WS.state[prefix+'Score'] === undefined);
	tripEditor.data('prefix', prefix);
	tripEditor.data('team', teamId);
	tripEditor.data('period', p);
	tripEditor.data('jam', j);
	tripEditor.data('trip', t);
	tripEditor.dialog('open');
}

function prepareTripEditor() {

	'use strict';
	$(initialize);

	function initialize() {

		tripEditor = $('#TripEditor').dialog({
			modal: true,
			closeOnEscape: false,
			title: 'Trip Editor',
			autoOpen: false,
			width: '300px',
		});

		tripEditor.append($('<table>')
				.append($('<tr>')
						.append($('<td>')
								.append($('<input type="number" min="0">').attr('id', 'score').keydown(function(event) {
									if (event.which == 13 && $(this).val() == '') {
										WS.Set(tripEditor.data('prefix')+'Remove', true);
										tripEditor.dialog('close');
									}
									}).change(function() {
										WS.Set(tripEditor.data('prefix')+'Score', $(this).val());
									})))
						.append($('<td>')
								.append($('<button>').attr('id', 'afterSP').text('After SP').button().click(function() {
									var check = !$(this).hasClass('checked');
									$(this).toggleClass('checked', check);
									WS.Set(tripEditor.data('prefix')+'AfterSP', check);
								}))))
				.append($('<tr class="buttons">')
						.append($('<td>').append($('<button>').attr('id','remove').text('Remove Trip').button().click(function() {
							WS.Set(tripEditor.data('prefix')+'Remove', true);
							tripEditor.dialog('close');
						})))
						.append($('<td>').append($('<button>').attr('id','insert_before').text('Insert Trip').button().click(function() {
							WS.Set(tripEditor.data('prefix')+'InsertBefore', true);
							tripEditor.dialog('close');
							setupTripEditor(tripEditor.data('period'), tripEditor.data('jam'), tripEditor.data('team'), tripEditor.data('trip'));
							tripEditor.find('#score').val(0); // the update of the popup may run before the WS is updated
						}))))
				.append($('<tr>').append($('<td>').attr('colspan', '2').append($('<hr>'))))
				.append($('<tr>').addClass('Annotation')
						.append($('<td>').addClass('header').text('Notes: '))
						.append($('<td>').append($('<button>').text('Clear Notes').button().click(function() {
							tripEditor.find('#annotation').val('');
						}))))
				.append($('<tr>').addClass('Annotation')
						.append($('<td>').attr('colspan', '2')
								.append($('<textarea>').attr('cols', '25').attr('rows', '4').attr('id', 'annotation').change(function() {
									WS.Set(tripEditor.data('prefix')+'Annotation', $(this).val());
								}))))
				.append($('<tr>').append($('<td>').attr('colspan', '2').append($('<hr>'))))
				.append($('<tr class="buttons nav">')
						.append($('<td>')
								.append($('<button>').text('⬅ Prev').attr('id', 'prev').button().click(function() {
									tripEditor.dialog('close');
									setupTripEditor(tripEditor.data('period'), tripEditor.data('jam'), tripEditor.data('team'), tripEditor.data('trip') - 1);
								}))
								.append($('<button>').text('Next ➡').attr('id', 'next').button().click(function() {
									tripEditor.dialog('close');
									setupTripEditor(tripEditor.data('period'), tripEditor.data('jam'), tripEditor.data('team'), tripEditor.data('trip') + 1);
								})))
						.append($('<td>').addClass('close').append($('<button>').attr('id','close').text('Close').button().click(function() {
							tripEditor.dialog('close');
						}))))
		);
	}
}

function showSkaterSelector(element, teamId) {
	$('#skaterSelector .skaterSelect').addClass('Hide');
	$('#skaterSelector #skaterSelect'+teamId).removeClass('Hide');
	console.log(element +'='+ WS.state[element]);
	$('#skaterSelector #skaterSelect'+teamId).val(WS.state[element]);
	$('#skaterSelector').data('element', element).dialog('open');
}

function prepareSkaterSelector() {
	
	'use strict';
	
	var selects = [];

	var selectorDialog = $('#skaterSelector').dialog({
		modal: true,
		closeOnEscape: false,
		title: 'Skater Selector',
		autoOpen: false,
		width: '200px',
	});

	$.each(['1','2'], function() {
		selects[String(this)] = $('<select>').attr('id', 'skaterSelect'+String(this)).addClass('skaterSelect').append($('<option>').attr('value', '').text('None/Unknown')).change(function() {
			WS.Set(selectorDialog.data('element'), $(this).val());
			selectorDialog.dialog('close');
		});
	});

	selectorDialog.append(selects['1']).append(selects['2']);
	
	WS.Register(['ScoreBoard.Team(*).Skater(*).Number', 'ScoreBoard.Team(*).Skater(*).Role'], function(k, v) {
		selects[k.Team].children('[value="'+k.Skater+'"]').remove();
		var prefix = 'ScoreBoard.Team('+k.Team+').Skater('+k.Skater+').';
		if (v != null && WS.state[prefix + 'Role'] != 'NotInGame') {
			var number = WS.state[prefix + 'Number'];
			var option = $('<option>').attr('number', number).val(k.Skater).text(number);
			_windowFunctions.appendAlphaSortedByAttr(selects[k.Team], option, 'number', 1);
		}
	});

	WS.Register(['ScoreBoard.Period(*).Jam(*).TeamJam(*).Fielding(*).Skater']);
}

//# sourceURL=controls\sk\sk-sheet.js
