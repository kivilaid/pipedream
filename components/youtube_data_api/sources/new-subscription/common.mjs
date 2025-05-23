import common from "../common/common.mjs";

export default {
  props: {
    ...common.props,
  },
  methods: {
    ...common.methods,
    _getLastExecutionDate() {
      return this.db.get("lastExecutionDate");
    },
    _setLastExecutionDate(lastExecutionDate) {
      this.db.set("lastExecutionDate", lastExecutionDate);
    },
    generateMeta(item) {
      return {
        id: item.id,
        summary: item.snippet.title,
        ts: new Date(item.snippet.publishedAt),
      };
    },
    async _emitLastSubscriptions(maxResults = 50) {
      let nextPageToken;
      do {
        const res = await this.youtubeDataApi.getSubscriptions({
          part: "id,snippet",
          mine: true,
          maxResults,
          pageToken: nextPageToken,
        });
        const items = res.data.items.reverse();
        let lastExecutionDate = this._getLastExecutionDate();

        for (const item of items) {
          const newLastTime = new Date(item.snippet.publishedAt).getTime();

          if (lastExecutionDate > newLastTime) {
            continue;
          }

          this.emitEvent(item);

          if (!lastExecutionDate || (newLastTime > lastExecutionDate)) {
            this._setLastExecutionDate(newLastTime);
            lastExecutionDate = newLastTime;
          }
        }
        nextPageToken = res.data.nextPageToken;
      } while (nextPageToken);
    },
  },
  hooks: {
    async activate() {
      await this._emitLastSubscriptions(25);
    },
  },
  async run() {
    await this._emitLastSubscriptions();
  },
};
