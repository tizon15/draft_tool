import { Injectable } from '@angular/core';
import { DraftResult } from './draft.result';
import { Player } from '../player/player';
import { TeamDefinition } from '../team.definition';
import { Http, Response } from '@angular/http';
import { Draft } from '../draft';
import { TeamPlayers } from '../team.players';
import { BaseService } from '../../base.service';

@Injectable()
export class DraftResultService extends BaseService {
    private draftResults = new Array<DraftResult>();
    constructor(private http: Http) { 
        super();
    }

    saveCustomDraftPick(pickNo: number, teamDefinition: TeamDefinition, player: Player, draft: Draft): any{
        
        let leagueKey = //draft.custom ? draft.leagueName : 
            draft.leagueKey;

        let url;
        let pickDTO = { PickNumber: pickNo, PlayerId: player.id, Cost: player.price, Team: teamDefinition ? teamDefinition.id : "" };
        let body = {pick: pickDTO, leagueName: leagueKey};
        url = this.GetBaseUrl() + `/Draft/SaveCustomDraftPick`;

        return this.http
        .post(url, body)
        .map((res: Response) => {
            return res;
        }).subscribe();
    }

    getCustomDraftResult(
        draft: Draft, players: Array<Player>, teamDefinitions: Array<TeamDefinition>): Promise<Array<DraftResult>> {

        let leagueKey = //draft.custom ? draft.leagueName : 
            draft.leagueKey;
        let url;

        url = this.GetBaseUrl() 
        + `/Draft/GetCustomLeagueDraftResults?leagueKey=${leagueKey}&reset=false&hijack=${draft.hijack}`;
       
        return this.http
        .get(url)
        .map((res: Response) => {
            let unknownPlayers = new Array<number>();
            let picks = new Array<DraftResult>();
            for (let pick of res.json()) {
                let player = players.filter(x => x.id == pick.PlayerId)[0];
                let team = teamDefinitions.filter(x => x.id == pick.Team)[0];
                if (!player) {
                    unknownPlayers.push(pick.PlayerId);
                    continue;
                } else {
                    player.picked = true;
                    player.price = pick.Cost;
                }

                let draftResult = new DraftResult(pick.PickNumber, player, team)
                draftResult.price = pick.Cost;
                picks.push(draftResult);
            }
            if (unknownPlayers.length) {
                console.log(`brak graczy ${unknownPlayers}`)
            }
            
            return picks;
        }).
        toPromise();
    }

    getDraftResult(draft: Draft, players: Array<Player>, teamDefinitions: Array<TeamDefinition>): Promise<Array<DraftResult>> {
        let url;

        if (draft.type == 'espn-custom') {
            let leagueKey = draft.leagueKey.split('.')[2];
            let teamId = draft.teamId.split('.')[4];
            url = this.GetBaseUrl() + `/leaguelist/GetDraftData?leagueKey=${leagueKey}&teamId=${teamId}&providerType=2`;
        }
        if (draft.type == 'yahoo-custom') {
            let teamId = draft.teamId.split('.')[4];
            url = this.GetBaseUrl() + `/leaguelist/GetDraftData?leagueKey=${draft.leagueKey}&teamId=${teamId}&providerType=1`;
        }
        if (draft.type == "espn-mock") {
            url = this.GetBaseUrl() + `/leaguelist/GetDraftData?leagueKey=${draft.leaqueId}&teamId=${draft.teamId}&providerType=2`;
        }
        if (draft.type == "yahoo-mock") {
            url = this.GetBaseUrl() + `/leaguelist/GetDraftData?leagueKey=${draft.leagueKey}&teamId=${draft.teamId}&providerType=1`;
        }

        return this.http
            .get(url)
            .map((res: Response) => {
                let unknownPlayers = new Array<number>();
                let picks = new Array<DraftResult>();
                for (let pick of res.json()) {
                    let player = players.filter(x => x.id == pick.PlayerId)[0];
                    let team = teamDefinitions.filter(x => x.id == pick.Team)[0];
                    if (!player) {
                        unknownPlayers.push(pick.PlayerId);
                        continue;
                    } else {
                        player.price = pick.Cost;
                        player.picked = true;
                    }

                    let draftResult = new DraftResult(pick.PickNumber, player, team)
                    draftResult.price = pick.Cost;
                    picks.push(draftResult);
                }
                if (unknownPlayers.length) {
                    console.log(`brak graczy ${unknownPlayers}`)
                }
                
                return picks;
            }).
            toPromise();
    }
}